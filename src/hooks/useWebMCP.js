import { useEffect, useRef } from 'react';
import { TEMPLATES } from '../templates';

export function useWebMCP({
  deviceElements,
  setDeviceElements,
  settings,
  setSettings,
  previewMode,
  cardTitle,
  setCardTitle,
  setShowToast
}) {
  // Keep fresh state references so tool handlers always read latest state
  const stateRef = useRef({
    deviceElements,
    settings,
    previewMode,
    cardTitle
  });

  useEffect(() => {
    stateRef.current = {
      deviceElements,
      settings,
      previewMode,
      cardTitle
    };
  }, [deviceElements, settings, previewMode, cardTitle]);

  useEffect(() => {
    // 1. Primary target is document.modelContext according to Chrome WebMCP docs
    if (typeof document !== 'undefined') {
      if (!document.modelContext) {
        document.modelContext = {};
      }
      const mc = document.modelContext;

      if (!mc._tools) mc._tools = new Map();

      mc.registerTool = function (toolDef) {
        if (!toolDef || !toolDef.name) {
          throw new Error('Tool definition must have a name property');
        }
        const execFn = toolDef.execute;
        const cleanTool = {
          name: toolDef.name,
          title: toolDef.title || toolDef.name,
          description: toolDef.description || '',
          inputSchema: toolDef.inputSchema || { type: 'object', properties: {} },
          toJSON() {
            return {
              name: this.name,
              title: this.title,
              description: this.description,
              inputSchema: this.inputSchema
            };
          }
        };
        if (typeof execFn === 'function') {
          Object.defineProperty(cleanTool, 'execute', {
            value: execFn,
            enumerable: false, // Prevents DataCloneError on Window postMessage
            writable: true,
            configurable: true
          });
        }
        mc._tools.set(toolDef.name, cleanTool);
        return cleanTool;
      };

      if (!mc.getTools) {
        mc.getTools = function () {
          return Array.from(mc._tools.values());
        };
      }

      if (!mc.executeTool) {
        mc.executeTool = async function (name, input) {
          const tool = mc._tools.get(name);
          if (!tool) {
            return {
              content: [{ type: 'text', text: `Error: Tool '${name}' not found` }],
              isError: true
            };
          }
          return await tool.execute(input);
        };
      }

      try {
        Object.defineProperty(mc, 'tools', {
          get() {
            return Array.from(mc._tools.values());
          },
          configurable: true
        });
      } catch (e) {}

      try { window.modelContext = mc; } catch (e) {}
      try { navigator.modelContext = mc; } catch (e) {}

      // 2. Register WebMCP Tools (document.modelContext.registerTool)

      // Tool 1: get_portfolio
      document.modelContext.registerTool({
        name: 'get_portfolio',
        title: 'Get Portfolio Canvas',
        description: 'Get current portfolio title, background settings, and active canvas elements',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        execute: async () => {
          const { deviceElements, settings, previewMode, cardTitle } = stateRef.current;
          const currentElements = deviceElements[previewMode] || [];
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  title: cardTitle,
                  settings,
                  previewMode,
                  elementsCount: currentElements.length,
                  elements: currentElements
                }, null, 2)
              }
            ]
          };
        }
      });

      // Tool 2: add_element
      document.modelContext.registerTool({
        name: 'add_element',
        title: 'Add Portfolio Element',
        description: 'Add a new element (text, button, image, card) to the portfolio canvas',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['text', 'button', 'image', 'card'],
              description: 'Type of component to create'
            },
            content: {
              type: 'string',
              description: 'Text content or image URL'
            },
            x: { type: 'number', description: 'X position coordinate in pixels' },
            y: { type: 'number', description: 'Y position coordinate in pixels' },
            w: { type: 'number', description: 'Width in pixels' },
            h: { type: 'number', description: 'Height in pixels' },
            style: {
              type: 'object',
              description: 'Custom CSS properties object (e.g. { color: "#fff", background: "#ec4899", borderRadius: "12px", fontSize: "24px" })'
            }
          },
          required: ['type']
        },
        execute: async (input) => {
          try {
            const { type, content, x, y, w, h, style } = input || {};
            const activeMode = stateRef.current.previewMode;

            let defaultContent = content;
            let defaultW = w || 200;
            let defaultH = h || 50;
            let baseStyle = {
              fontFamily: 'Inter',
              fontWeight: type === 'text' ? 'normal' : 'bold',
              color: type === 'button' ? '#ffffff' : '#0f172a',
              ...(style || {})
            };

            if (type === 'text') {
              if (!defaultContent) defaultContent = 'New Text Block';
            } else if (type === 'button') {
              if (!defaultContent) defaultContent = 'Click Me';
              if (!style?.background) baseStyle.background = '#4f46e5';
              if (!style?.borderRadius) baseStyle.borderRadius = '8px';
            } else if (type === 'image') {
              if (!defaultContent) defaultContent = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80';
              defaultW = w || 250;
              defaultH = h || 200;
              if (!style?.borderRadius) baseStyle.borderRadius = '16px';
            } else if (type === 'card' || type === 'shape') {
              if (!defaultContent) defaultContent = '';
              defaultW = w || 300;
              defaultH = h || 200;
              if (!style?.background) baseStyle.background = '#ffffff';
              if (!style?.borderRadius) baseStyle.borderRadius = '16px';
            }

            const currentElements = stateRef.current.deviceElements[activeMode] || [];
            const maxZ = currentElements.reduce((max, el) => Math.max(max, el.z || 1), 0);
            const newId = Math.random().toString(36).substr(2, 9);

            const defaultX = x !== undefined ? x : (activeMode === 'mobile' ? 30 : Math.max(20, Math.floor(1050 / 2 - defaultW / 2)));
            const defaultY = y !== undefined ? y : (activeMode === 'mobile' ? 30 : Math.max(20, Math.floor(600 / 2 - defaultH / 2)));

            const newElement = {
              id: newId,
              type: type === 'shape' ? 'card' : type,
              content: defaultContent,
              x: defaultX,
              y: defaultY,
              w: defaultW,
              h: defaultH,
              z: maxZ + 1,
              locked: false,
              style: baseStyle
            };

            setDeviceElements(prev => ({
              ...prev,
              [activeMode]: [...(prev[activeMode] || []), newElement]
            }));

            if (setShowToast) {
              setShowToast(`🤖 WebMCP: Added element "${newElement.type}"`);
              setTimeout(() => setShowToast(''), 3000);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `Element added successfully with ID: ${newId}`
                }
              ]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error executing add_element: ${err.message}` }],
              isError: true
            };
          }
        }
      });

      // Tool 3: update_element_style
      document.modelContext.registerTool({
        name: 'update_element_style',
        title: 'Update Element Style',
        description: 'Update CSS style properties (e.g. color, background, borderRadius, fontSize, fontStyle, boxShadow) of an element by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Target element ID' },
            style: {
              type: 'object',
              description: 'CSS properties object to merge into existing style'
            }
          },
          required: ['id', 'style']
        },
        execute: async (input) => {
          try {
            const { id, style } = input || {};
            const activeMode = stateRef.current.previewMode;
            let found = false;

            setDeviceElements(prev => {
              const list = prev[activeMode] || [];
              const updatedList = list.map(el => {
                if (el.id === id) {
                  found = true;
                  return {
                    ...el,
                    style: { ...(el.style || {}), ...style }
                  };
                }
                return el;
              });
              return { ...prev, [activeMode]: updatedList };
            });

            if (setShowToast) {
              setShowToast(`🤖 WebMCP: Updated style for element "${id}"`);
              setTimeout(() => setShowToast(''), 3000);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: found ? `Style updated for element ID: ${id}` : `Element ID: ${id} not found`
                }
              ]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error updating style: ${err.message}` }],
              isError: true
            };
          }
        }
      });

      // Tool 4: move_element
      document.modelContext.registerTool({
        name: 'move_element',
        title: 'Move Element',
        description: 'Move an element to specific (x, y) coordinates on the canvas',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Target element ID' },
            x: { type: 'number', description: 'New X position in pixels' },
            y: { type: 'number', description: 'New Y position in pixels' }
          },
          required: ['id', 'x', 'y']
        },
        execute: async (input) => {
          try {
            const { id, x, y } = input || {};
            const activeMode = stateRef.current.previewMode;

            setDeviceElements(prev => {
              const list = prev[activeMode] || [];
              return {
                ...prev,
                [activeMode]: list.map(el => el.id === id ? { ...el, x, y } : el)
              };
            });

            if (setShowToast) {
              setShowToast(`🤖 WebMCP: Moved element "${id}" to (${x}, ${y})`);
              setTimeout(() => setShowToast(''), 3000);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `Moved element ${id} to x:${x}, y:${y}`
                }
              ]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error moving element: ${err.message}` }],
              isError: true
            };
          }
        }
      });

      // Tool 5: resize_element
      document.modelContext.registerTool({
        name: 'resize_element',
        title: 'Resize Element',
        description: 'Resize an element width (w) and height (h) in pixels',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Target element ID' },
            w: { type: 'number', description: 'New width in pixels' },
            h: { type: 'number', description: 'New height in pixels' }
          },
          required: ['id', 'w', 'h']
        },
        execute: async (input) => {
          try {
            const { id, w, h } = input || {};
            const activeMode = stateRef.current.previewMode;

            setDeviceElements(prev => {
              const list = prev[activeMode] || [];
              return {
                ...prev,
                [activeMode]: list.map(el => el.id === id ? { ...el, w, h } : el)
              };
            });

            if (setShowToast) {
              setShowToast(`🤖 WebMCP: Resized element "${id}" to ${w}x${h}`);
              setTimeout(() => setShowToast(''), 3000);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `Resized element ${id} to w:${w}, h:${h}`
                }
              ]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error resizing element: ${err.message}` }],
              isError: true
            };
          }
        }
      });

      // Tool 6: delete_element
      document.modelContext.registerTool({
        name: 'delete_element',
        title: 'Delete Element',
        description: 'Delete an element from the portfolio canvas by its ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Element ID to delete' }
          },
          required: ['id']
        },
        execute: async (input) => {
          try {
            const { id } = input || {};
            const activeMode = stateRef.current.previewMode;

            setDeviceElements(prev => {
              const list = prev[activeMode] || [];
              return {
                ...prev,
                [activeMode]: list.filter(el => el.id !== id)
              };
            });

            if (setShowToast) {
              setShowToast(`🤖 WebMCP: Deleted element "${id}"`);
              setTimeout(() => setShowToast(''), 3000);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `Deleted element ID: ${id}`
                }
              ]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error deleting element: ${err.message}` }],
              isError: true
            };
          }
        }
      });

      // Tool 7: update_background
      document.modelContext.registerTool({
        name: 'update_background',
        title: 'Update Canvas Background',
        description: 'Update portfolio background color, background image, or size',
        inputSchema: {
          type: 'object',
          properties: {
            backgroundColor: { type: 'string', description: 'Solid color or CSS gradient string' },
            backgroundImage: { type: 'string', description: 'Image URL or "none"' },
            backgroundSize: { type: 'string', description: '"cover", "contain", or "auto"' }
          }
        },
        execute: async (input) => {
          try {
            const { backgroundColor, backgroundImage, backgroundSize } = input || {};

            setSettings(prev => ({
              ...prev,
              ...(backgroundColor !== undefined ? { backgroundColor } : {}),
              ...(backgroundImage !== undefined ? { backgroundImage } : {}),
              ...(backgroundSize !== undefined ? { backgroundSize } : {})
            }));

            if (setShowToast) {
              setShowToast(`🤖 WebMCP: Background updated!`);
              setTimeout(() => setShowToast(''), 3000);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: 'Background settings updated successfully'
                }
              ]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error updating background: ${err.message}` }],
              isError: true
            };
          }
        }
      });

      // Tool 8: apply_template
      document.modelContext.registerTool({
        name: 'apply_template',
        title: 'Apply Portfolio Template',
        description: 'Apply a pre-built template design (minimal, creative, blank)',
        inputSchema: {
          type: 'object',
          properties: {
            templateName: {
              type: 'string',
              enum: ['minimal', 'creative', 'blank'],
              description: 'Template key name'
            }
          },
          required: ['templateName']
        },
        execute: async (input) => {
          try {
            const { templateName } = input || {};
            const tpl = TEMPLATES[templateName];
            if (!tpl) {
              return {
                content: [{ type: 'text', text: `Template "${templateName}" not found. Available: minimal, creative, blank` }],
                isError: true
              };
            }

            setSettings(tpl.settings);
            setDeviceElements({
              desktop: tpl.desktopElements || [],
              tablet: [],
              mobile: []
            });

            if (setShowToast) {
              setShowToast(`🤖 WebMCP: Applied template "${tpl.name}"`);
              setTimeout(() => setShowToast(''), 3000);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: `Template "${tpl.name}" applied successfully`
                }
              ]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error applying template: ${err.message}` }],
              isError: true
            };
          }
        }
      });

      // Tool 9: clear_canvas
      document.modelContext.registerTool({
        name: 'clear_canvas',
        title: 'Clear Portfolio Canvas',
        description: 'Clear all elements from the active canvas',
        inputSchema: {
          type: 'object',
          properties: {}
        },
        execute: async () => {
          try {
            const activeMode = stateRef.current.previewMode;

            setDeviceElements(prev => ({
              ...prev,
              [activeMode]: []
            }));

            if (setShowToast) {
              setShowToast(`🤖 WebMCP: Canvas cleared!`);
              setTimeout(() => setShowToast(''), 3000);
            }

            return {
              content: [
                {
                  type: 'text',
                  text: 'Canvas cleared successfully'
                }
              ]
            };
          } catch (err) {
            return {
              content: [{ type: 'text', text: `Error clearing canvas: ${err.message}` }],
              isError: true
            };
          }
        }
      });
    }
  }, [setDeviceElements, setSettings, setCardTitle, setShowToast]);
}
