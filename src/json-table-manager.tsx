import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Edit3, Check, X, Eye, EyeOff, Settings, MapPin, Plus, Trash2, Tags } from 'lucide-react';

const JsonTableManager = () => {
  const [jsonData, setJsonData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');
  const [fieldVisibility, setFieldVisibility] = useState({});
  const [showFieldPanel, setShowFieldPanel] = useState(false);
  const [showMappingPanel, setShowMappingPanel] = useState(false);
  const [showCategoriesPanel, setShowCategoriesPanel] = useState(false);
  const [columnOrder, setColumnOrder] = useState([]);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [valueMappings, setValueMappings] = useState({
    kitchenColor: {
      display: {
        '0': 'Black',
        '1': 'Dark Blue', 
        '2': 'Dark Green',
        '3': 'Dark Cyan',
        '4': 'Dark Red',
        '5': 'Dark Purple',
        '6': 'Dark Yellow',
        '7': 'Light Gray',
        '8': 'Dark Gray',
        '9': 'Blue',
        '10': 'Green',
        '11': 'Cyan',
        '12': 'Red',
        '13': 'Purple',
        '14': 'Yellow',
        '15': 'White'
      },
      storage: {
        'Black': '0',
        'Dark Blue': '1',
        'Dark Green': '2',
        'Dark Cyan': '3',
        'Dark Red': '4',
        'Dark Purple': '5',
        'Dark Yellow': '6',
        'Light Gray': '7',
        'Dark Gray': '8',
        'Blue': '9',
        'Green': '10',
        'Cyan': '11',
        'Red': '12',
        'Purple': '13',
        'Yellow': '14',
        'White': '15'
      }
    }
  });
  const fileInputRef = useRef(null);

  // Sample data for demo
  const sampleData = [
    {
      itemNumber: 101,
      itemNames: {
        longName: "Big Mac - Large Quarter Pound Burger",
        monitorName: "Big Mac",
        receiptName: "Big Mac"
      },
      kitchenColor: "12",
      kitchenPriority: 1,
      kitchenCategories: ["Burgers", "Popular"],
      itemRouting: "3",
      brandID: "1",
      buildCardURL: {
        url: "https://example.com/bigmac",
        version: "1.0"
      },
      PMIX: "A1",
      IMIX: "B2",
      fryMix: "C3"
    },
    {
      itemNumber: 102,
      itemNames: {
        longName: "Quarter Pounder with Cheese - Premium Beef Burger",
        monitorName: "Quarter Pounder",
        receiptName: "1/4 Lb Burger"
      },
      kitchenColor: "9",
      kitchenPriority: 2,
      kitchenCategories: ["Burgers", "Premium"],
      itemRouting: "3",
      brandID: "1",
      buildCardURL: {
        url: "https://example.com/quarter",
        version: "1.1"
      },
      PMIX: "A2",
      IMIX: "B1",
      fryMix: "C1"
    },
    {
      itemNumber: 103,
      itemNames: {
        longName: "Chicken McNuggets - Premium White Meat Chicken",
        monitorName: "Chicken McNuggets",
        receiptName: "McNuggets"
      },
      kitchenColor: "14",
      kitchenPriority: 3,
      kitchenCategories: ["Chicken", "Popular", "Kids"],
      itemRouting: "3",
      brandID: "1",
      buildCardURL: {
        url: "https://example.com/nuggets",
        version: "2.0"
      },
      PMIX: "A3",
      IMIX: "B3",
      fryMix: "C2"
    }
  ];

  // Default visible fields in preferred order
  const defaultVisibleFields = [
    'itemNumber',
    'itemNames.longName',
    'itemNames.monitorName', 
    'itemNames.receiptName',
    'kitchenColor',
    'kitchenPriority',
    'kitchenCategories'
  ];

  // Helper function to format field names properly
  const formatFieldName = (field) => {
    // Handle special cases first
    const specialCases = {
      'IMIX': 'IMIX',
      'PMIX': 'PMIX', 
      'brandID': 'Brand ID',
      'kdsDisplayName': 'KDS Display Name',
      'kdsExpertName': 'KDS Expert Name',
      'buildCardURL': 'Build Card URL'
    };

    // Remove itemNames. prefix for processing
    const cleanField = field.replace('itemNames.', '');
    
    // Check if it's a special case
    if (specialCases[cleanField]) {
      return specialCases[cleanField];
    }
    
    // Default formatting: add spaces before capitals and capitalize first letter
    return cleanField.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  // Simple component for adding mapping pairs
  const AddMappingForm = ({ fieldName, onAdd }) => {
    const [storage, setStorage] = useState('');
    const [display, setDisplay] = useState('');

    const handleAdd = () => {
      if (storage.trim() && display.trim()) {
        onAdd(fieldName, storage.trim(), display.trim());
        setStorage('');
        setDisplay('');
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleAdd();
      }
    };

    return (
      <div className="flex gap-1">
        <input
          type="text"
          placeholder="Storage value (e.g., 35)"
          className="border rounded px-2 py-1 text-xs flex-1"
          value={storage}
          onChange={(e) => setStorage(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <input
          type="text"
          placeholder="Display value (e.g., Orange)"
          className="border rounded px-2 py-1 text-xs flex-1"
          value={display}
          onChange={(e) => setDisplay(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          onClick={handleAdd}
          className="text-green-600 hover:text-green-800"
          title="Add new mapping pair"
        >
          <Plus size={14} />
        </button>
      </div>
    );
  };

  // Set default kitchenColor mappings
  const setDefaultKitchenColorMappings = () => {
    const defaultKitchenColorMappings = {
      display: {
        '0': 'Black',
        '1': 'Dark Blue', 
        '2': 'Dark Green',
        '3': 'Dark Cyan',
        '4': 'Dark Red',
        '5': 'Dark Purple',
        '6': 'Dark Yellow',
        '7': 'Light Gray',
        '8': 'Dark Gray',
        '9': 'Blue',
        '10': 'Green',
        '11': 'Cyan',
        '12': 'Red',
        '13': 'Purple',
        '14': 'Yellow',
        '15': 'White'
      },
      storage: {
        'Black': '0',
        'Dark Blue': '1',
        'Dark Green': '2',
        'Dark Cyan': '3',
        'Dark Red': '4',
        'Dark Purple': '5',
        'Dark Yellow': '6',
        'Light Gray': '7',
        'Dark Gray': '8',
        'Blue': '9',
        'Green': '10',
        'Cyan': '11',
        'Red': '12',
        'Purple': '13',
        'Yellow': '14',
        'White': '15'
      }
    };

    setValueMappings(prev => ({
      ...prev,
      kitchenColor: defaultKitchenColorMappings
    }));
  };

  const mapValueForDisplay = (key, value) => {
    if (valueMappings[key] && valueMappings[key].display[value] !== undefined) {
      return valueMappings[key].display[value];
    }
    return value;
  };

  const mapValueForStorage = (key, value) => {
    if (valueMappings[key] && valueMappings[key].storage[value] !== undefined) {
      return valueMappings[key].storage[value];
    }
    return value;
  };

  const getAllPossibleFields = () => {
    if (jsonData.length === 0) return [];
    
    const allFields = new Set();
    
    // Check ALL items, not just the first one
    jsonData.forEach(item => {
      // Handle nested itemNames object
      if (item.itemNames) {
        Object.keys(item.itemNames).forEach(key => {
          allFields.add(`itemNames.${key}`);
        });
      }
      
      // Add other top-level properties
      Object.keys(item).forEach(key => {
        if (key !== 'itemNames' && key !== 'kitchenCategories') {
          allFields.add(key);
        }
      });
      
      // Add kitchenCategories as a special field
      if (item.kitchenCategories) {
        allFields.add('kitchenCategories');
      }
    });
    
    return Array.from(allFields).sort();
  };

  const initializeFieldVisibility = (fields) => {
    const visibility = {};
    fields.forEach(field => {
      visibility[field] = defaultVisibleFields.includes(field);
    });
    setFieldVisibility(visibility);
  };

  const initializeColumnOrder = (fields) => {
    const orderedFields = [...defaultVisibleFields];
    
    fields.forEach(field => {
      if (!orderedFields.includes(field)) {
        orderedFields.push(field);
      }
    });
    
    setColumnOrder(orderedFields);
  };

  const getVisibleColumns = () => {
    const allFields = getAllPossibleFields();
    const visibleFields = allFields.filter(field => fieldVisibility[field] === true);
    
    if (columnOrder.length > 0) {
      const orderedFields = [];
      
      columnOrder.forEach(field => {
        if (visibleFields.includes(field)) {
          orderedFields.push(field);
        }
      });
      
      visibleFields.forEach(field => {
        if (!orderedFields.includes(field)) {
          orderedFields.push(field);
        }
      });
      
      return orderedFields;
    }
    
    return visibleFields;
  };

  const toggleFieldVisibility = (field) => {
    setFieldVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const showAllFields = () => {
    const allFields = getAllPossibleFields();
    const newVisibility = {};
    allFields.forEach(field => {
      newVisibility[field] = true;
    });
    setFieldVisibility(newVisibility);
  };

  const hideAllFields = () => {
    const allFields = getAllPossibleFields();
    const newVisibility = {};
    allFields.forEach(field => {
      newVisibility[field] = false;
    });
    setFieldVisibility(newVisibility);
  };

  const getAllKitchenCategories = () => {
    if (jsonData.length === 0) return availableCategories.sort();
    
    const allCategories = new Set();
    
    // Add categories from items
    jsonData.forEach(item => {
      if (Array.isArray(item.kitchenCategories)) {
        item.kitchenCategories.forEach(category => {
          allCategories.add(category);
        });
      }
    });
    
    // Add available categories that might not be used yet
    availableCategories.forEach(category => {
      allCategories.add(category);
    });
    
    return Array.from(allCategories).sort();
  };

  const resetToDefaults = () => {
    const allFields = getAllPossibleFields();
    initializeFieldVisibility(allFields);
    initializeColumnOrder(allFields);
  };

  const addFieldMapping = (fieldName) => {
    if (!fieldName || valueMappings[fieldName]) return;
    
    setValueMappings(prev => ({
      ...prev,
      [fieldName]: {
        display: {},
        storage: {}
      }
    }));
  };

  const removeFieldMapping = (fieldName) => {
    setValueMappings(prev => {
      const newMappings = { ...prev };
      delete newMappings[fieldName];
      return newMappings;
    });
  };

  const addMappingPair = (fieldName, storageValue, displayValue) => {
    if (!storageValue || !displayValue) return;
    
    setValueMappings(prev => ({
      ...prev,
      [fieldName]: {
        display: {
          ...prev[fieldName].display,
          [storageValue]: displayValue
        },
        storage: {
          ...prev[fieldName].storage,
          [displayValue]: storageValue
        }
      }
    }));
  };

  const removeMappingPair = (fieldName, storageValue) => {
    setValueMappings(prev => {
      const newDisplay = { ...prev[fieldName].display };
      const newStorage = { ...prev[fieldName].storage };
      
      const displayValue = newDisplay[storageValue];
      delete newDisplay[storageValue];
      delete newStorage[displayValue];
      
      return {
        ...prev,
        [fieldName]: {
          display: newDisplay,
          storage: newStorage
        }
      };
    });
  };

  const getFieldsWithValues = () => {
    if (jsonData.length === 0) return {};
    
    const fieldsWithValues = {};
    const allFields = getAllPossibleFields();
    
    allFields.forEach(field => {
      const uniqueValues = new Set();
      jsonData.forEach(row => {
        const value = getValue(row, field);
        if (value !== '' && value !== null && value !== undefined && field !== 'kitchenCategories') {
          uniqueValues.add(value);
        }
      });
      
      if (uniqueValues.size > 0 && uniqueValues.size <= 20) {
        fieldsWithValues[field] = Array.from(uniqueValues);
      }
    });
    
    return fieldsWithValues;
  };

  const handleColumnDragStart = (e, columnName) => {
    setDraggedColumn(columnName);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleColumnDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedColumn(null);
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e, targetColumn) => {
    e.preventDefault();
    
    if (!draggedColumn || draggedColumn === targetColumn) return;
    
    const currentOrder = [...columnOrder];
    const draggedIndex = currentOrder.indexOf(draggedColumn);
    const targetIndex = currentOrder.indexOf(targetColumn);
    
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedColumn);
    
    setColumnOrder(currentOrder);
  };

  const resetColumnOrder = () => {
    const allFields = getAllPossibleFields();
    initializeColumnOrder(allFields);
  };

  const getKitchenCategoryUsage = () => {
    const categoryUsage = {};
    
    // First, initialize all available categories with 0 count
    const allCategories = getAllKitchenCategories();
    allCategories.forEach(category => {
      categoryUsage[category] = 0;
    });
    
    // Then count actual usage from the data
    if (jsonData.length > 0) {
      jsonData.forEach(item => {
        if (Array.isArray(item.kitchenCategories)) {
          item.kitchenCategories.forEach(category => {
            categoryUsage[category] = (categoryUsage[category] || 0) + 1;
          });
        }
      });
    }
    
    return categoryUsage;
  };

  const addKitchenCategory = (categoryName) => {
    if (!categoryName.trim()) return;
    
    const trimmedName = categoryName.trim();
    
    // Check if category already exists
    const existingCategories = getAllKitchenCategories();
    if (existingCategories.includes(trimmedName)) {
      console.log(`Category "${trimmedName}" already exists!`);
      setNewCategoryName('');
      return;
    }
    
    // Add to available categories list
    setAvailableCategories(prev => [...prev, trimmedName]);
    setNewCategoryName('');
    console.log(`Added new category: "${trimmedName}"`);
  };

  const deleteKitchenCategory = (categoryName) => {
    if (!categoryName) return;
    
    // Remove the category from all items that use it
    const newData = jsonData.map(item => {
      if (Array.isArray(item.kitchenCategories)) {
        return {
          ...item,
          kitchenCategories: item.kitchenCategories.filter(cat => cat !== categoryName)
        };
      }
      return item;
    });
    
    // Update the data state
    setJsonData(newData);
    
    // Also remove from available categories list
    setAvailableCategories(prev => prev.filter(cat => cat !== categoryName));
    
    // Close the confirmation modal
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
    
    console.log(`Deleted category "${categoryName}" from data and available categories`);
  };

  const handleDeleteClick = (category, count) => {
    setCategoryToDelete({ name: category, count: count });
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteKitchenCategory(categoryToDelete.name);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  const addNewItem = () => {
    if (jsonData.length === 0) return;
    
    // Find the next available itemNumber to avoid duplicates
    const existingNumbers = new Set(jsonData.map(item => item.itemNumber).filter(num => num != null));
    let nextItemNumber = 1;
    
    // Find the first available number starting from 1
    while (existingNumbers.has(nextItemNumber)) {
      nextItemNumber++;
    }
    
    const newItem = {
      itemNumber: nextItemNumber,
      itemNames: {
        longName: "New Item Long Name",
        monitorName: "New Item",
        receiptName: "New Item"
      },
      kitchenColor: "15", // Default to White
      kitchenPriority: 1,
      kitchenCategories: [],
      itemRouting: "3", // Default to Kitchen
      brandID: "1", // Default to first brand
      buildCardURL: {
        smallImgURL: "",
        mediumImgURL: "",
        largeImgURL: ""
      },
      PMIX: "",
      IMIX: "",
      fryMix: ""
    };
    
    // Add to the beginning of the data (top of table)
    setJsonData(prev => [newItem, ...prev]);
    console.log(`Added new item with ID ${nextItemNumber} to top of table`);
  };

  const toggleKitchenCategory = (rowIndex, category) => {
    const newData = [...jsonData];
    const currentCategories = newData[rowIndex].kitchenCategories || [];
    
    if (currentCategories.includes(category)) {
      newData[rowIndex].kitchenCategories = currentCategories.filter(cat => cat !== category);
    } else {
      newData[rowIndex].kitchenCategories = [...currentCategories, category];
    }
    
    setJsonData(newData);
  };

  useEffect(() => {
    setJsonData(sampleData);
    setOriginalData(JSON.parse(JSON.stringify(sampleData)));
    setFileName('sample-restaurant-data.json');
  }, []);

  useEffect(() => {
    if (jsonData.length > 0) {
      const allFields = getAllPossibleFields();
      if (allFields.length > 0) {
        initializeFieldVisibility(allFields);
        initializeColumnOrder(allFields);
      }
    }
  }, [jsonData]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const dataArray = Array.isArray(parsed) ? parsed : [parsed];
        setJsonData(dataArray);
        setOriginalData(JSON.parse(JSON.stringify(dataArray)));
        setError('');
        
        setDefaultKitchenColorMappings();
      } catch (err) {
        setError('Invalid JSON file. Please check the format.');
      }
    };
    
    reader.readAsText(file);
  };

  const getValue = (row, column) => {
    if (column.startsWith('itemNames.')) {
      const nameKey = column.replace('itemNames.', '');
      return row.itemNames?.[nameKey] || '';
    }
    if (column === 'kitchenCategories') {
      return Array.isArray(row.kitchenCategories) ? row.kitchenCategories.join(', ') : '';
    }
    
    const value = row[column];
    
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    
    return value || '';
  };

  const setValue = (rowIndex, column, value) => {
    const newData = [...jsonData];
    if (column.startsWith('itemNames.')) {
      const nameKey = column.replace('itemNames.', '');
      if (!newData[rowIndex].itemNames) newData[rowIndex].itemNames = {};
      newData[rowIndex].itemNames[nameKey] = value;
    } else if (column === 'kitchenCategories') {
      newData[rowIndex].kitchenCategories = value.split(',').map(cat => cat.trim()).filter(cat => cat);
    } else {
      try {
        const originalValue = newData[rowIndex][column];
        if (typeof originalValue === 'object' && originalValue !== null) {
          newData[rowIndex][column] = JSON.parse(value);
        } else {
          newData[rowIndex][column] = value;
        }
      } catch (e) {
        newData[rowIndex][column] = value;
      }
    }
    setJsonData(newData);
  };

  const handleCellEdit = (rowIndex, key) => {
    const currentValue = getValue(jsonData[rowIndex], key);
    setEditingCell({ rowIndex, key });
    setEditValue(mapValueForDisplay(key, currentValue));
  };

  const handleCellSave = () => {
    if (editingCell) {
      const { rowIndex, key } = editingCell;
      const storageValue = mapValueForStorage(key, editValue);
      setValue(rowIndex, key, storageValue);
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleSaveFile = () => {
    // Show JSON in modal instead of downloading
    setShowJsonModal(true);
  };

  const copyJsonToClipboard = async () => {
    const dataStr = JSON.stringify(jsonData, null, 2);
    try {
      await navigator.clipboard.writeText(dataStr);
      console.log('JSON copied to clipboard');
    } catch (err) {
      console.log('Failed to copy to clipboard:', err);
      // Fallback: select the text
      const textArea = document.getElementById('json-output');
      if (textArea) {
        textArea.select();
        textArea.setSelectionRange(0, 99999);
      }
    }
  };

  const hasChanges = JSON.stringify(jsonData) !== JSON.stringify(originalData);

  const renderCellContent = (rowIndex, key, value) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.key === key;
    const actualValue = getValue(jsonData[rowIndex], key);
    
    if (key === 'kitchenCategories' && isEditing) {
      const allCategories = getAllKitchenCategories();
      const currentCategories = jsonData[rowIndex].kitchenCategories || [];
      
      return (
        <div className="absolute z-10 border rounded p-2 bg-white shadow-lg min-w-80 max-w-96">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-sm">Kitchen Categories</span>
            <div className="flex gap-1">
              <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">
                <Check size={14} />
              </button>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto grid grid-cols-1 gap-1">
            {allCategories.map(category => (
              <label key={category} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                <input
                  type="checkbox"
                  checked={currentCategories.includes(category)}
                  onChange={() => toggleKitchenCategory(rowIndex, category)}
                  className="rounded text-blue-600"
                />
                <span className="flex-1">{category}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {currentCategories.length} of {allCategories.length} categories selected
          </div>
        </div>
      );
    }
    
    if (isEditing) {
      if (valueMappings[key]) {
        const options = Object.keys(valueMappings[key].storage);
        return (
          <div className="flex items-center gap-1">
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="border rounded px-1 py-0.5 text-sm min-w-0"
              autoFocus
            >
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <button onClick={handleCellSave} className="text-green-600 hover:text-green-800 flex-shrink-0">
              <Check size={14} />
            </button>
            <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        );
      } else if (typeof jsonData[rowIndex][key] === 'object' && jsonData[rowIndex][key] !== null) {
        return (
          <div className="flex items-center gap-1">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="border rounded px-1 py-0.5 text-sm w-full resize-none font-mono text-xs"
              rows="3"
              placeholder="Enter valid JSON"
              autoFocus
            />
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button onClick={handleCellSave} className="text-green-600 hover:text-green-800">
                <Check size={14} />
              </button>
              <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800">
                <X size={14} />
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="border rounded px-1 py-0.5 text-sm w-full min-w-0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellSave();
                if (e.key === 'Escape') handleCellCancel();
              }}
            />
            <button onClick={handleCellSave} className="text-green-600 hover:text-green-800 flex-shrink-0">
              <Check size={14} />
            </button>
            <button onClick={handleCellCancel} className="text-red-600 hover:text-red-800 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
        );
      }
    }

    const displayValue = mapValueForDisplay(key, actualValue);
    
    if (key === 'kitchenCategories') {
      const currentCategories = jsonData[rowIndex].kitchenCategories || [];
      const allCategories = getAllKitchenCategories();
      
      return (
        <div 
          className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[2rem]"
          onClick={() => handleCellEdit(rowIndex, key)}
          title={`${currentCategories.length} of ${allCategories.length} categories: ${currentCategories.join(', ')}`}
        >
          <div className="flex flex-col">
            <span className="text-sm font-medium">{currentCategories.length} / {allCategories.length}</span>
            <span className="text-xs text-gray-500 truncate max-w-32">
              {currentCategories.slice(0, 2).join(', ')}
              {currentCategories.length > 2 && '...'}
            </span>
          </div>
          <Edit3 size={12} className="opacity-0 group-hover:opacity-50 flex-shrink-0" />
        </div>
      );
    }
    
    let truncatedValue = displayValue;
    if (typeof displayValue === 'string') {
      if (displayValue.length > 100) {
        truncatedValue = displayValue.substring(0, 100) + '...';
      }
    }

    return (
      <div 
        className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-1 rounded min-h-[2rem]"
        onClick={() => handleCellEdit(rowIndex, key)}
        title={typeof displayValue === 'string' && displayValue.length > 50 ? displayValue : undefined}
      >
        <span className="text-sm break-all">{truncatedValue}</span>
        <Edit3 size={12} className="opacity-0 group-hover:opacity-50 flex-shrink-0" />
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">JSON Table Manager</h1>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Upload size={16} />
              Load JSON File
            </button>
          </div>
          
          {jsonData.length > 0 && (
            <>
              <button
                onClick={handleSaveFile}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  hasChanges 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                <Download size={16} />
                Save JSON
                {hasChanges && <span className="text-xs bg-green-500 px-1 rounded">*</span>}
              </button>
              
              <button
                onClick={() => setShowFieldPanel(!showFieldPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                <Settings size={16} />
                Field Visibility
              </button>
              
              <button
                onClick={() => setShowMappingPanel(!showMappingPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                <MapPin size={16} />
                Value Mappings
              </button>
              
              <button
                onClick={() => setShowCategoriesPanel(!showCategoriesPanel)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              >
                <Tags size={16} />
                Categories Manager
              </button>
              
              <button
                onClick={addNewItem}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                <Plus size={16} />
                Add New Item
              </button>
            </>
          )}
        </div>

        {fileName && (
          <div className="text-sm text-gray-600 mb-2">
            <p>Loaded: <span className="font-medium">{fileName}</span>
            {hasChanges && <span className="text-orange-600 ml-2">(unsaved changes)</span>}</p>
            <p className="text-xs text-gray-500 mt-1">
              Showing {getVisibleColumns().length} of {getAllPossibleFields().length} fields
            </p>
          </div>
        )}
      </div>

      {/* Field Visibility Panel */}
      {showFieldPanel && jsonData.length > 0 && (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-800">Field Visibility Controls</h3>
            <div className="flex gap-2">
              <button
                onClick={showAllFields}
                className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Show All
              </button>
              <button
                onClick={hideAllFields}
                className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Hide All
              </button>
              <button
                onClick={resetToDefaults}
                className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reset
              </button>
              <button
                onClick={resetColumnOrder}
                className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Reset Order
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
            {getAllPossibleFields().map(field => (
              <label key={field} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                <input
                  type="checkbox"
                  checked={fieldVisibility[field] === true}
                  onChange={() => toggleFieldVisibility(field)}
                  className="rounded"
                />
                {fieldVisibility[field] === true ? (
                  <Eye size={14} className="text-green-600" />
                ) : (
                  <EyeOff size={14} className="text-gray-400" />
                )}
                <span className={`${fieldVisibility[field] !== true ? 'text-gray-500' : ''}`}>
                  {formatFieldName(field)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Value Mappings Configuration Panel */}
      {showMappingPanel && jsonData.length > 0 && (
        <div className="bg-purple-50 border rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-800 mb-3">Value Mappings Configuration</h3>
          
          <div className="mb-4 p-3 bg-white rounded border">
            <h4 className="text-sm font-medium mb-2">Add Field Mapping</h4>
            <div className="flex gap-2">
              <select 
                className="border rounded px-2 py-1 text-sm"
                onChange={(e) => {
                  if (e.target.value) {
                    addFieldMapping(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Select field to map...</option>
                {Object.entries(getFieldsWithValues())
                  .filter(([field]) => !valueMappings[field])
                  .map(([field, values]) => (
                    <option key={field} value={field}>
                      {field} ({values.length} unique values)
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(valueMappings).map(([fieldName, mapping]) => (
              <div key={fieldName} className="p-3 bg-white rounded border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{fieldName}</h4>
                  <button
                    onClick={() => removeFieldMapping(fieldName)}
                    className="text-red-600 hover:text-red-800"
                    title="Remove mapping"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="space-y-1 mb-2">
                  {Object.entries(mapping.display).map(([storageValue, displayValue]) => (
                    <div key={storageValue} className="flex items-center gap-2 text-xs">
                      <code className="bg-gray-100 px-1 rounded">{storageValue}</code>
                      <span>→</span>
                      <span className="bg-blue-100 px-1 rounded">{displayValue}</span>
                      <button
                        onClick={() => removeMappingPair(fieldName, storageValue)}
                        className="text-red-600 hover:text-red-800 ml-auto"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                <AddMappingForm fieldName={fieldName} onAdd={addMappingPair} />

                {getFieldsWithValues()[fieldName] && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Values in data: </span>
                    {getFieldsWithValues()[fieldName].slice(0, 10).map(value => (
                      <code key={value} className="bg-gray-100 px-1 rounded mr-1">{value}</code>
                    ))}
                    {getFieldsWithValues()[fieldName].length > 10 && <span>...</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kitchen Categories Manager Panel */}
      {showCategoriesPanel && jsonData.length > 0 && (
        <div className="bg-orange-50 border rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-800 mb-3">Kitchen Categories Manager</h3>
          
          <div className="mb-4 p-3 bg-white rounded border">
            <h4 className="text-sm font-medium mb-2">Add New Category</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name..."
                className="border rounded px-3 py-2 text-sm flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addKitchenCategory(newCategoryName);
                  }
                }}
              />
              <button
                onClick={() => addKitchenCategory(newCategoryName)}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
              >
                <Plus size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              New categories become available for assignment but aren't automatically added to items.
            </p>
          </div>

          <div className="bg-white rounded border">
            <div className="p-3 border-b bg-gray-50">
              <h4 className="text-sm font-medium">Current Categories</h4>
              <p className="text-xs text-gray-600">Categories currently used in your data</p>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {Object.entries(getKitchenCategoryUsage())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                    <div className="flex-1">
                      <span className="text-sm font-medium">{category}</span>
                      <div className="text-xs text-gray-600">
                        Used by {count} item{count !== 1 ? 's' : ''}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteClick(category, count)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded"
                      title={`Delete category (used by ${count} items)`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              }
              
              {Object.keys(getKitchenCategoryUsage()).length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  <Tags size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No kitchen categories found in data</p>
                </div>
              )}
            </div>
            
            {Object.keys(getKitchenCategoryUsage()).length > 0 && (
              <div className="p-3 bg-gray-50 text-xs text-gray-600 border-t">
                Total: {Object.keys(getKitchenCategoryUsage()).length} unique categories across {jsonData.length} items
              </div>
            )}
          </div>
        </div>
      )}

      {/* JSON Export Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Export JSON Data</h3>
                <p className="text-sm text-gray-600">Copy the JSON below to save your data</p>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 p-4 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={copyJsonToClipboard}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  <Download size={16} />
                  Copy to Clipboard
                </button>
                <span className="text-sm text-gray-600">
                  File: {fileName || 'data.json'} ({jsonData.length} items)
                </span>
              </div>
              
              <textarea
                id="json-output"
                value={JSON.stringify(jsonData, null, 2)}
                readOnly
                className="w-full h-96 p-3 border rounded font-mono text-xs bg-gray-50 resize-none"
                placeholder="JSON data will appear here..."
              />
            </div>
            
            <div className="flex justify-end gap-2 p-4 border-t">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteConfirm && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Delete Category</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-700">
                Are you sure you want to delete the <strong>"{categoryToDelete.name}"</strong> category?
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This will remove it from <strong>{categoryToDelete.count} item{categoryToDelete.count !== 1 ? 's' : ''}</strong> that currently use it.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {jsonData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                {getVisibleColumns().map((column) => (
                  <th 
                    key={column} 
                    className={`border border-gray-300 px-2 py-2 text-left font-medium text-gray-700 text-sm cursor-move select-none ${
                      draggedColumn === column ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                    draggable="true"
                    onDragStart={(e) => handleColumnDragStart(e, column)}
                    onDragEnd={handleColumnDragEnd}
                    onDragOver={handleColumnDragOver}
                    onDrop={(e) => handleColumnDrop(e, column)}
                    title="Drag to reorder columns"
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">⋮⋮</span>
                      <span>{formatFieldName(column)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {jsonData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {getVisibleColumns().map((column) => (
                    <td key={column} className="border border-gray-300 px-2 py-1 max-w-xs">
                      {renderCellContent(rowIndex, column, getValue(row, column))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Upload a JSON file to get started</p>
          <p className="text-sm text-gray-500 mt-2">
            Supports arrays of objects or single objects
          </p>
        </div>
      )}

      {jsonData.length > 0 && (
        <div className="mt-6 text-sm text-gray-600">
          <p className="mb-2"><strong>Restaurant Item Data Features:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Default view shows: Item Number, Long Name, Monitor Name, Receipt Name, Kitchen Color, Priority, Categories</li>
            <li>Use Field Visibility panel to show/hide additional columns as needed</li>
            <li>Click any cell to edit - nested item names are flattened for easy editing</li>
            <li>Kitchen categories show as "X / Y" format - click to open checkbox interface</li>
            <li>Checkbox interface shows all categories from the entire dataset</li>
            <li>Click "Categories Manager" to view, add, and delete kitchen categories</li>
            <li>Categories show usage counts and can be safely deleted from all items</li>
            <li>Drag column headers to reorder them (look for ⋮⋮ drag handle)</li>
            <li>Click "Reset Order" in Field Visibility panel to restore default order</li>
            <li>Use Enter to save or Escape to cancel while editing</li>
            <li>Kitchen colors now use standard 16-color palette (0=Black, 9=Blue, 12=Red, 14=Yellow, etc.)</li>
            <li><strong>NEW: Click "Add New Item" to add a new row to your data</strong></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default JsonTableManager;