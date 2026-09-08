import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  AuditLog,
  Cabinet,
  CloudSettings,
  Item,
  PrintSettings,
  Shelf,
  WardData,
} from './types';
import {
  defaultCabinets,
  defaultInitialWardData,
  defaultPrintSettings,
  initialWardOptions,
} from './data/defaultData';
import {
  checkExpStatus,
  getCurrentDateKey,
  getCurrentMonthKey,
  getCurrentTimeString,
  getCurrentYearKey,
  getFullDateTimeString,
  triggerHaptic,
} from './utils/helpers';

import { Header } from './components/Header';
import { CabinetView } from './components/CabinetView';
import { UnassignedView } from './components/UnassignedView';
import { AnalyticsView } from './components/AnalyticsView';
import { AuditView } from './components/AuditView';
import { BulkMoveBar } from './components/BulkMoveBar';
import { ItemEditModal } from './components/ItemEditModal';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { AppleScriptModal } from './components/AppleScriptModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { DuplicateReportModal } from './components/DuplicateReportModal';
import { PrintModal } from './components/PrintModal';
import { SettingsModal } from './components/SettingsModal';
import { CloudModal } from './components/CloudModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SearchModal } from './components/SearchModal';

const STORAGE_KEY = 'shelf_system_data';

export default function App() {
  // --- Core State ---
  const [wards, setWards] = useState<string[]>(initialWardOptions);
  const [currentWard, setCurrentWard] = useState<string>(initialWardOptions[0]);
  const [allWardsData, setAllWardsData] = useState<Record<string, WardData>>(defaultInitialWardData);
  const [stockAuditLogs, setStockAuditLogs] = useState<AuditLog[]>([]);
  const [printSettings, setPrintSettings] = useState<PrintSettings>(defaultPrintSettings);
  const [cloudSettings, setCloudSettings] = useState<CloudSettings>({
    gasUrl: '',
    autoSync: false,
    lastSync: null,
  });

  // UI State
  const [currentTab, setCurrentTab] = useState<'cabinets' | 'unassigned' | 'analytics' | 'audit'>('cabinets');
  const [currentCabIndex, setCurrentCabIndex] = useState<number>(0);
  const [isCountMode, setIsCountMode] = useState<boolean>(false);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [saveTarget, setSaveTarget] = useState<'local' | 'cloud'>('local');
  const [saveStatusMsg, setSaveStatusMsg] = useState<string>('✓ บันทึกลงเครื่องแล้ว');
  const [highlightUid, setHighlightUid] = useState<string | null>(null);

  // Modals state
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [lightboxData, setLightboxData] = useState<{ isOpen: boolean; imgSrc: string; name: string; code: string }>({
    isOpen: false,
    imgSrc: '',
    name: '',
    code: '',
  });
  const [isScanOpen, setIsScanOpen] = useState<boolean>(false);
  const [isAppleScriptOpen, setIsAppleScriptOpen] = useState<boolean>(false);
  const [isImportExcelOpen, setIsImportExcelOpen] = useState<boolean>(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCloudOpen, setIsCloudOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Undo / Redo history
  const historyStackRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const isHistoryActionRef = useRef(false);

  // --- Load Initial from LocalStorage ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.wards && parsed.wards.length > 0) setWards(parsed.wards);
        if (parsed.currentWard) setCurrentWard(parsed.currentWard);
        if (parsed.allWardsData) setAllWardsData(parsed.allWardsData);
        if (parsed.stockAuditLogs) setStockAuditLogs(parsed.stockAuditLogs);
        if (parsed.printSettings) setPrintSettings(parsed.printSettings);
        if (parsed.cloudSettings) setCloudSettings(parsed.cloudSettings);

        // Record initial snapshot
        historyStackRef.current = [saved];
        historyIndexRef.current = 0;
        setCanUndo(false);
        setCanRedo(false);
      } else {
        const initialSnapshot = JSON.stringify({
          wards: initialWardOptions,
          currentWard: initialWardOptions[0],
          allWardsData: defaultInitialWardData,
          stockAuditLogs: [],
          printSettings: defaultPrintSettings,
          cloudSettings: { gasUrl: '', autoSync: false },
        });
        historyStackRef.current = [initialSnapshot];
        historyIndexRef.current = 0;
      }
    } catch {
      // Storage parsing fallback
    }
  }, []);

  // Sync snapshot & push history
  const recordStateChange = useCallback(
    (
      newWardsData: Record<string, WardData>,
      newLogs: AuditLog[],
      newWards?: string[],
      newWard?: string,
      newPrintSettings?: PrintSettings,
      newCloudSettings?: CloudSettings
    ) => {
      const snapshot = JSON.stringify({
        wards: newWards || wards,
        currentWard: newWard || currentWard,
        allWardsData: newWardsData,
        stockAuditLogs: newLogs,
        printSettings: newPrintSettings || printSettings,
        cloudSettings: newCloudSettings || cloudSettings,
      });

      try {
        localStorage.setItem(STORAGE_KEY, snapshot);
        setSaveStatusMsg('⏳ บันทึก...');
        setTimeout(() => setSaveStatusMsg('✓ บันทึกลงเครื่องแล้ว'), 200);
      } catch {
        // storage quota
      }

      if (!isHistoryActionRef.current) {
        if (historyIndexRef.current < historyStackRef.current.length - 1) {
          historyStackRef.current = historyStackRef.current.slice(0, historyIndexRef.current + 1);
        }
        historyStackRef.current.push(snapshot);
        historyIndexRef.current++;
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(false);
      }
    },
    [wards, currentWard, printSettings, cloudSettings]
  );

  // Undo / Redo
  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--;
      const snapshotStr = historyStackRef.current[historyIndexRef.current];
      if (snapshotStr) {
        isHistoryActionRef.current = true;
        const parsed = JSON.parse(snapshotStr);
        setWards(parsed.wards);
        setCurrentWard(parsed.currentWard);
        setAllWardsData(parsed.allWardsData);
        setStockAuditLogs(parsed.stockAuditLogs || []);
        if (parsed.printSettings) setPrintSettings(parsed.printSettings);
        if (parsed.cloudSettings) setCloudSettings(parsed.cloudSettings);
        localStorage.setItem(STORAGE_KEY, snapshotStr);
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
        isHistoryActionRef.current = false;
        triggerHaptic();
      }
    }
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyIndexRef.current++;
      const snapshotStr = historyStackRef.current[historyIndexRef.current];
      if (snapshotStr) {
        isHistoryActionRef.current = true;
        const parsed = JSON.parse(snapshotStr);
        setWards(parsed.wards);
        setCurrentWard(parsed.currentWard);
        setAllWardsData(parsed.allWardsData);
        setStockAuditLogs(parsed.stockAuditLogs || []);
        if (parsed.printSettings) setPrintSettings(parsed.printSettings);
        if (parsed.cloudSettings) setCloudSettings(parsed.cloudSettings);
        localStorage.setItem(STORAGE_KEY, snapshotStr);
        setCanUndo(historyIndexRef.current > 0);
        setCanRedo(historyIndexRef.current < historyStackRef.current.length - 1);
        isHistoryActionRef.current = false;
        triggerHaptic();
      }
    }
  }, []);

  // Keyboard shortcut Ctrl+Z / Ctrl+Y
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Current ward data
  const currentWardData: WardData = allWardsData[currentWard] || {
    cabinets: defaultCabinets,
    unassigned: [],
  };

  // Helper to log stock change
  const logStockChange = (
    cabName: string,
    shelfName: string,
    item: Item,
    oldQty: number,
    newQty: number,
    actionType: 'ตรวจนับ' | 'เบิกใช้' | 'เติมของ' | 'ปรับปรุงยอด',
    note: string
  ) => {
    const delta = newQty - oldQty;
    const newLog: AuditLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: getFullDateTimeString(),
      ward: currentWard,
      cabinet: cabName,
      shelf: shelfName,
      code: item.code,
      name: item.name,
      oldQty,
      newQty,
      change: delta >= 0 ? `+${delta}` : `${delta}`,
      actionType,
      note: note || '-',
      responsiblePerson: printSettings.responsiblePerson || '-',
    };

    const updatedLogs = [newLog, ...stockAuditLogs].slice(0, 500);
    setStockAuditLogs(updatedLogs);
    return updatedLogs;
  };

  // --- Ward Management ---
  const handleSelectWard = (ward: string) => {
    setCurrentWard(ward);
    setCurrentCabIndex(0);
  };

  const handleAddWard = () => {
    const name = prompt('กรุณากรอกชื่อหอผู้ป่วยใหม่:');
    if (name && !wards.includes(name.trim())) {
      const trimmed = name.trim();
      const updatedWards = [...wards, trimmed];
      const updatedAllData = {
        ...allWardsData,
        [trimmed]: {
          cabinets: [
            {
              id: `cab_${Date.now()}`,
              name: 'ตู้ที่ 1',
              shelves: [{ id: `shelf_${Date.now()}`, name: 'ชั้นที่ 1', items: [] }],
            },
          ],
          unassigned: [],
        },
      };
      setWards(updatedWards);
      setCurrentWard(trimmed);
      setAllWardsData(updatedAllData);
      recordStateChange(updatedAllData, stockAuditLogs, updatedWards, trimmed);
    }
  };

  const handleDeleteWard = () => {
    if (wards.length <= 1) {
      alert('ต้องมีอย่างน้อย 1 หอผู้ป่วยในระบบ');
      return;
    }
    if (confirm(`คุณต้องการลบ "${currentWard}" หรือไม่?`)) {
      const remainingWards = wards.filter((w) => w !== currentWard);
      const updatedAllData = { ...allWardsData };
      delete updatedAllData[currentWard];
      const nextWard = remainingWards[0];
      setWards(remainingWards);
      setCurrentWard(nextWard);
      setAllWardsData(updatedAllData);
      recordStateChange(updatedAllData, stockAuditLogs, remainingWards, nextWard);
    }
  };

  // --- Cabinet & Shelf Operations ---
  const updateCurrentWardCabinets = (newCabinets: Cabinet[]) => {
    const updatedWardData: WardData = {
      ...currentWardData,
      cabinets: newCabinets,
    };
    const updatedAll = {
      ...allWardsData,
      [currentWard]: updatedWardData,
    };
    setAllWardsData(updatedAll);
    recordStateChange(updatedAll, stockAuditLogs);
  };

  const handleAddCabinet = () => {
    const newCab: Cabinet = {
      id: `cab_${Date.now()}`,
      name: `ตู้ที่ ${currentWardData.cabinets.length + 1}`,
      shelves: [
        {
          id: `shelf_${Date.now()}`,
          name: 'ชั้นที่ 1',
          items: [],
        },
      ],
    };
    updateCurrentWardCabinets([...currentWardData.cabinets, newCab]);
    setCurrentCabIndex(currentWardData.cabinets.length);
  };

  const handleRenameCabinet = (cabIdx: number, newName: string) => {
    const updated = [...currentWardData.cabinets];
    if (updated[cabIdx]) {
      updated[cabIdx].name = newName;
      updateCurrentWardCabinets(updated);
    }
  };

  const handleDeleteCabinet = (cabIdx: number) => {
    if (currentWardData.cabinets.length <= 1) {
      alert('ต้องมีอย่างน้อย 1 ตู้ในระบบ');
      return;
    }
    const updated = currentWardData.cabinets.filter((_, i) => i !== cabIdx);
    updateCurrentWardCabinets(updated);
    setCurrentCabIndex(Math.max(0, cabIdx - 1));
  };

  const handleInsertCabinet = (cabIdx: number) => {
    const newCab: Cabinet = {
      id: `cab_${Date.now()}`,
      name: `ตู้ที่ ${currentWardData.cabinets.length + 1} (ใหม่)`,
      shelves: [{ id: `shelf_${Date.now()}`, name: 'ชั้นที่ 1', items: [] }],
    };
    const updated = [...currentWardData.cabinets];
    updated.splice(cabIdx, 0, newCab);
    updateCurrentWardCabinets(updated);
    setCurrentCabIndex(cabIdx);
  };

  const handleAddShelf = (cabIdx: number) => {
    const updated = [...currentWardData.cabinets];
    const cab = updated[cabIdx];
    if (cab) {
      const newShelf: Shelf = {
        id: `shelf_${Date.now()}`,
        name: `ชั้นที่ ${cab.shelves.length + 1}`,
        items: [],
      };
      cab.shelves.push(newShelf);
      updateCurrentWardCabinets(updated);
    }
  };

  const handleRenameShelf = (cabIdx: number, shelfIdx: number, newName: string) => {
    const updated = [...currentWardData.cabinets];
    if (updated[cabIdx]?.shelves[shelfIdx]) {
      updated[cabIdx].shelves[shelfIdx].name = newName;
      updateCurrentWardCabinets(updated);
    }
  };

  const handleMoveShelfOrder = (cabIdx: number, shelfIdx: number, direction: 'up' | 'down') => {
    const updated = [...currentWardData.cabinets];
    const shelves = updated[cabIdx]?.shelves;
    if (!shelves) return;

    const targetIdx = direction === 'up' ? shelfIdx - 1 : shelfIdx + 1;
    if (targetIdx < 0 || targetIdx >= shelves.length) return;

    const temp = shelves[shelfIdx];
    shelves[shelfIdx] = shelves[targetIdx];
    shelves[targetIdx] = temp;
    updateCurrentWardCabinets(updated);
  };

  const handleDeleteShelf = (cabIdx: number, shelfIdx: number) => {
    const updated = [...currentWardData.cabinets];
    if (updated[cabIdx]) {
      updated[cabIdx].shelves = updated[cabIdx].shelves.filter((_, i) => i !== shelfIdx);
      updateCurrentWardCabinets(updated);
    }
  };

  const handleClearShelf = (cabIdx: number, shelfIdx: number) => {
    const updated = [...currentWardData.cabinets];
    if (updated[cabIdx]?.shelves[shelfIdx]) {
      updated[cabIdx].shelves[shelfIdx].items = [];
      updateCurrentWardCabinets(updated);
    }
  };

  const handleMoveShelfToCabinet = (cabIdx: number, shelfIdx: number, targetCabIdx: number) => {
    const updated = [...currentWardData.cabinets];
    const sourceCab = updated[cabIdx];
    const targetCab = updated[targetCabIdx];
    if (sourceCab && targetCab && sourceCab.shelves[shelfIdx]) {
      const shelfToMove = sourceCab.shelves[shelfIdx];
      sourceCab.shelves = sourceCab.shelves.filter((_, i) => i !== shelfIdx);
      targetCab.shelves.push(shelfToMove);
      updateCurrentWardCabinets(updated);
      alert(`ย้ายชั้นวางไปยัง "${targetCab.name}" เรียบร้อยแล้ว!`);
    }
  };

  const handleAddItemToShelf = (cabIdx: number, shelfIdx: number) => {
    const updated = [...currentWardData.cabinets];
    const shelf = updated[cabIdx]?.shelves[shelfIdx];
    if (shelf) {
      const newItem: Item = {
        uid: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        code: `ITEM-0${shelf.items.length + 1}`,
        name: 'เวชภัณฑ์ใหม่',
        qty: 1,
        min: 5,
        max: 10,
        unit: 'ชิ้น',
        lastUpdated: getCurrentTimeString(),
        isCounted: false,
        totalUsed: 0,
        countRounds: 0,
        usageStats: {},
        exp: '',
        lot: '',
      };
      shelf.items.push(newItem);
      updateCurrentWardCabinets(updated);
      setEditingItem(newItem);
    }
  };

  // --- Item Modifications ---
  const handleQuickQtyChange = (item: Item, delta: number, actionType: 'เบิกใช้' | 'เติมของ') => {
    const oldQty = item.qty;
    const newQty = Math.max(0, oldQty + delta);
    if (newQty === oldQty) return;

    let updatedLogs = stockAuditLogs;

    // Locate and update item
    const updatedCabs = currentWardData.cabinets.map((c) => ({
      ...c,
      shelves: c.shelves.map((s) => ({
        ...s,
        items: s.items.map((it) => {
          if (it.uid === item.uid) {
            const tu = (it.totalUsed || 0) + (delta < 0 ? Math.abs(delta) : 0);
            const uStats = { ...(it.usageStats || {}) };
            const diff = delta < 0 ? Math.abs(delta) : 0;
            if (diff > 0) {
              const tK = getCurrentDateKey();
              const mK = getCurrentMonthKey();
              const yK = getCurrentYearKey();
              uStats[tK] = (uStats[tK] || 0) + diff;
              uStats[mK] = (uStats[mK] || 0) + diff;
              uStats[yK] = (uStats[yK] || 0) + diff;
            }

            updatedLogs = logStockChange(
              c.name,
              s.name,
              it,
              oldQty,
              newQty,
              actionType,
              'ปรับด่วนบนการ์ด'
            );

            return {
              ...it,
              qty: newQty,
              lastUpdated: getCurrentTimeString(),
              isCounted: true,
              totalUsed: tu,
              countRounds: (it.countRounds || 0) + 1,
              usageStats: uStats,
            };
          }
          return it;
        }),
      })),
    }));

    const updatedWardData: WardData = {
      ...currentWardData,
      cabinets: updatedCabs,
    };
    const updatedAll = {
      ...allWardsData,
      [currentWard]: updatedWardData,
    };
    setAllWardsData(updatedAll);
    recordStateChange(updatedAll, updatedLogs);
    triggerHaptic();
  };

  const handleMarkItemCounted = (item: Item) => {
    const updatedCabs = currentWardData.cabinets.map((c) => ({
      ...c,
      shelves: c.shelves.map((s) => ({
        ...s,
        items: s.items.map((it) => {
          if (it.uid === item.uid) {
            return {
              ...it,
              lastUpdated: getCurrentTimeString(),
              isCounted: true,
            };
          }
          return it;
        }),
      })),
    }));

    const updatedWardData: WardData = {
      ...currentWardData,
      cabinets: updatedCabs,
    };
    const updatedAll = {
      ...allWardsData,
      [currentWard]: updatedWardData,
    };
    setAllWardsData(updatedAll);
    recordStateChange(updatedAll, stockAuditLogs);
    triggerHaptic();
  };

  const handleSaveModalItem = (
    updatedItem: Item,
    actionType: 'ตรวจนับ' | 'เบิกใช้' | 'เติมของ' | 'ปรับปรุงยอด',
    note: string
  ) => {
    let updatedLogs = stockAuditLogs;

    // Check if in cabinets
    let foundInCab = false;
    const updatedCabs = currentWardData.cabinets.map((c) => ({
      ...c,
      shelves: c.shelves.map((s) => ({
        ...s,
        items: s.items.map((it) => {
          if (it.uid === updatedItem.uid) {
            foundInCab = true;
            const oldQty = it.qty;
            const newQty = updatedItem.qty;
            const diff = newQty < oldQty ? oldQty - newQty : 0;
            const tu = (it.totalUsed || 0) + diff;
            const uStats = { ...(it.usageStats || {}) };

            if (diff > 0) {
              const tK = getCurrentDateKey();
              const mK = getCurrentMonthKey();
              const yK = getCurrentYearKey();
              uStats[tK] = (uStats[tK] || 0) + diff;
              uStats[mK] = (uStats[mK] || 0) + diff;
              uStats[yK] = (uStats[yK] || 0) + diff;
            }

            if (oldQty !== newQty || note || actionType !== 'ตรวจนับ') {
              updatedLogs = logStockChange(
                c.name,
                s.name,
                it,
                oldQty,
                newQty,
                actionType,
                note
              );
            }

            return {
              ...updatedItem,
              lastUpdated: getCurrentTimeString(),
              isCounted: true,
              totalUsed: tu,
              countRounds: (it.countRounds || 0) + 1,
              usageStats: uStats,
            };
          }
          return it;
        }),
      })),
    }));

    // Or check unassigned
    let updatedUnassigned = currentWardData.unassigned;
    if (!foundInCab) {
      updatedUnassigned = currentWardData.unassigned.map((it) => {
        if (it.uid === updatedItem.uid) {
          return {
            ...updatedItem,
            lastUpdated: getCurrentTimeString(),
          };
        }
        return it;
      });
    }

    const updatedWardData: WardData = {
      ...currentWardData,
      cabinets: updatedCabs,
      unassigned: updatedUnassigned,
    };
    const updatedAll = {
      ...allWardsData,
      [currentWard]: updatedWardData,
    };
    setAllWardsData(updatedAll);
    recordStateChange(updatedAll, updatedLogs);
    setEditingItem(null);
    triggerHaptic();
  };

  // --- Bulk Selection & Move ---
  const handleToggleItemSelect = (uid: string, selected: boolean) => {
    setSelectedUids((prev) => (selected ? [...prev, uid] : prev.filter((id) => id !== uid)));
  };

  const handleExecuteBulkMove = (targetCabIndex: number, targetShelfIndex: number) => {
    if (selectedUids.length === 0) return;

    const itemsToMove: Item[] = [];

    // Remove from shelves
    const updatedCabs = currentWardData.cabinets.map((c) => ({
      ...c,
      shelves: c.shelves.map((s) => ({
        ...s,
        items: s.items.filter((it) => {
          if (selectedUids.includes(it.uid)) {
            itemsToMove.push(it);
            return false;
          }
          return true;
        }),
      })),
    }));

    // Remove from unassigned
    const updatedUnassigned = currentWardData.unassigned.filter((it) => {
      if (selectedUids.includes(it.uid)) {
        itemsToMove.push(it);
        return false;
      }
      return true;
    });

    // Add into destination shelf
    const destCab = updatedCabs[targetCabIndex];
    if (destCab && destCab.shelves[targetShelfIndex]) {
      destCab.shelves[targetShelfIndex].items.push(...itemsToMove);
    }

    const updatedWardData: WardData = {
      ...currentWardData,
      cabinets: updatedCabs,
      unassigned: updatedUnassigned,
    };
    const updatedAll = {
      ...allWardsData,
      [currentWard]: updatedWardData,
    };
    setAllWardsData(updatedAll);
    recordStateChange(updatedAll, stockAuditLogs);
    setSelectedUids([]);
    alert(`📦 ย้ายสิ่งของที่เลือกจำนวน ${itemsToMove.length} รายการ เรียบร้อยแล้ว!`);
  };

  // --- Unassigned Items Management ---
  const handleAssignUnassignedToShelf = (
    itemUids: string[],
    cabIndex: number,
    shelfIndex: number
  ) => {
    const itemsToMove = currentWardData.unassigned.filter((it) => itemUids.includes(it.uid));
    const remainingUnassigned = currentWardData.unassigned.filter(
      (it) => !itemUids.includes(it.uid)
    );

    const updatedCabs = [...currentWardData.cabinets];
    const targetCab = updatedCabs[cabIndex];
    if (targetCab && targetCab.shelves[shelfIndex]) {
      targetCab.shelves[shelfIndex].items.push(...itemsToMove);
    }

    const updatedWardData: WardData = {
      ...currentWardData,
      cabinets: updatedCabs,
      unassigned: remainingUnassigned,
    };
    const updatedAll = {
      ...allWardsData,
      [currentWard]: updatedWardData,
    };
    setAllWardsData(updatedAll);
    recordStateChange(updatedAll, stockAuditLogs);
    alert(`🚀 จัดเข้าชั้นวางเรียบร้อยแล้ว (${itemsToMove.length} รายการ)!`);
  };

  const handleDeleteUnassignedItems = (itemUids: string[]) => {
    const updatedUnassigned = currentWardData.unassigned.filter(
      (it) => !itemUids.includes(it.uid)
    );
    const updatedWardData: WardData = {
      ...currentWardData,
      unassigned: updatedUnassigned,
    };
    const updatedAll = {
      ...allWardsData,
      [currentWard]: updatedWardData,
    };
    setAllWardsData(updatedAll);
    recordStateChange(updatedAll, stockAuditLogs);
  };

  const handleAddNewUnassignedItem = () => {
    const newItem: Item = {
      uid: `unassigned_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      code: `ITEM-${currentWardData.unassigned.length + 1}`,
      name: 'รายการใหม่',
      qty: 1,
      min: 5,
      max: 10,
      unit: 'ชิ้น',
      lastUpdated: '',
      isCounted: false,
      totalUsed: 0,
      countRounds: 0,
      usageStats: {},
      exp: '',
      lot: '',
    };
    const updatedWardData: WardData = {
      ...currentWardData,
      unassigned: [newItem, ...currentWardData.unassigned],
    };
    const updatedAll = {
      ...allWardsData,
      [currentWard]: updatedWardData,
    };
    setAllWardsData(updatedAll);
    recordStateChange(updatedAll, stockAuditLogs);
    setEditingItem(newItem);
  };

  const handleCleanDuplicateGroup = (code: string, name: string) => {
    const matches = currentWardData.unassigned.filter(
      (it) => (it.code || '').trim() === code && (it.name || '').trim() === name
    );

    if (matches.length > 1) {
      // Keep only first item
      const toRemoveUids = matches.slice(1).map((it) => it.uid);
      const updatedUnassigned = currentWardData.unassigned.filter(
        (it) => !toRemoveUids.includes(it.uid)
      );
      const updatedWardData: WardData = {
        ...currentWardData,
        unassigned: updatedUnassigned,
      };
      const updatedAll = {
        ...allWardsData,
        [currentWard]: updatedWardData,
      };
      setAllWardsData(updatedAll);
      recordStateChange(updatedAll, stockAuditLogs);
    }
  };

  const handleCleanAllDuplicates = () => {
    const seen = new Set<string>();
    const cleanedUnassigned: Item[] = [];
    let removedCount = 0;

    currentWardData.unassigned.forEach((it) => {
      const key = `${(it.code || '').trim()}___${(it.name || '').trim()}`;
      if (seen.has(key)) {
        removedCount++;
      } else {
        seen.add(key);
        cleanedUnassigned.push(it);
      }
    });

    const updatedWardData: WardData = {
      ...currentWardData,
      unassigned: cleanedUnassigned,
    };
    const updatedAll = {
      ...allWardsData,
      [currentWard]: updatedWardData,
    };
    setAllWardsData(updatedAll);
    recordStateChange(updatedAll, stockAuditLogs);
    setIsDuplicateModalOpen(false);
    alert(`✨ ลบรายการซ้ำซ้อนออกไป ${removedCount} รายการเรียบร้อยแล้ว!`);
  };

  // --- Reset stock counting status ---
  const handleResetCountStatus = () => {
    if (confirm('คุณต้องการรีเซ็ตสถานะการนับ ให้ทุกกล่องกลับมารอตรวจนับใหม่ทั้งหมดหรือไม่?')) {
      const updatedCabs = currentWardData.cabinets.map((c) => ({
        ...c,
        shelves: c.shelves.map((s) => ({
          ...s,
          items: s.items.map((it) => ({
            ...it,
            isCounted: false,
          })),
        })),
      }));
      updateCurrentWardCabinets(updatedCabs);
      alert('รีเซ็ตสถานะการตรวจนับเรียบร้อยแล้ว!');
    }
  };

  // --- Barcode / QR Detected Handler ---
  const handleBarcodeDetected = (code: string) => {
    // Search in current ward cabinets first
    let found = false;
    currentWardData.cabinets.forEach((c, cIdx) => {
      c.shelves.forEach((s, sIdx) => {
        s.items.forEach((it) => {
          if (it.code.toLowerCase() === code.toLowerCase() || it.name.toLowerCase().includes(code.toLowerCase())) {
            found = true;
            setCurrentTab('cabinets');
            setCurrentCabIndex(cIdx);
            setHighlightUid(it.uid);
            setTimeout(() => {
              setHighlightUid(null);
              setEditingItem(it);
            }, 500);
          }
        });
      });
    });

    if (!found) {
      if (confirm(`สแกนพบ [${code}] แต่ไม่พบในตู้ของหอผู้ป่วยนี้\nต้องการเพิ่มลงในชั้นแรกของตู้นี้หรือไม่?`)) {
        const newItem: Item = {
          uid: `item_${Date.now()}`,
          code: code,
          name: 'ของใหม่จากการสแกน',
          qty: 1,
          min: 5,
          max: 10,
          unit: 'ชิ้น',
          lastUpdated: getCurrentTimeString(),
          isCounted: false,
          totalUsed: 0,
          countRounds: 0,
          usageStats: {},
          exp: '',
          lot: '',
        };

        const updated = [...currentWardData.cabinets];
        if (updated[0]?.shelves[0]) {
          updated[0].shelves[0].items.push(newItem);
          updateCurrentWardCabinets(updated);
          setEditingItem(newItem);
        }
      }
    }
  };

  // --- Export All Inventory to Excel ---
  const handleExportAllExcel = () => {
    const rows: any[] = [];
    let no = 1;

    (Object.entries(allWardsData) as [string, WardData][]).forEach(([wName, wData]) => {
      wData.cabinets.forEach((cab) => {
        cab.shelves.forEach((shelf) => {
          shelf.items.forEach((item) => {
            const qty = item.qty || 0;
            const min = item.min || 0;
            const max = item.max || 0;
            const restock = max > qty ? max - qty : 0;
            const expInfo = checkExpStatus(item.exp);

            rows.push({
              ลำดับ: no++,
              หอผู้ป่วย: wName,
              ตู้: cab.name,
              ชั้นวาง: shelf.name,
              รหัสสิ่งของ: item.code,
              ชื่อสิ่งของ: item.name,
              จำนวนคงเหลือ: qty,
              หน่วยนับ: item.unit || 'ชิ้น',
              'ขั้นต่ำ (MIN)': min,
              'สูงสุด (MAX)': max,
              ยอดต้องเบิกเติม: restock,
              'วันหมดอายุ (EXP)': item.exp || '-',
              'Lot No.': item.lot || '-',
              สถานะหมดอายุ: expInfo.label || 'ปกติ',
              ตรวจนับแล้ว: item.isCounted ? 'ใช่' : 'รอตรวจนับ',
              อัปเดตล่าสุด: item.lastUpdated || '-',
            });
          });
        });
      });
    });

    if (rows.length === 0) {
      alert('ไม่มีข้อมูลสิ่งของที่จะส่งออก');
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 30 },
      { wch: 14 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 12 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'รายการสต็อกรวม');
    XLSX.writeFile(
      wb,
      `รายงานสต็อกตู้ชั้นวาง_รพ.ราชพิพัฒน์_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  // --- NotePad Save & Load ---
  const handleSaveTxtNotePad = () => {
    const filename = prompt(
      'ตั้งชื่อไฟล์ NotePad:',
      `สต็อก_${currentWard}_${new Date().toISOString().slice(0, 10)}.txt`
    );
    if (!filename) return;

    const dataSnapshot = {
      wards,
      currentWard,
      allWardsData,
      stockAuditLogs,
      printSettings,
      cloudSettings,
    };

    const blob = new Blob([JSON.stringify(dataSnapshot, null, 2)], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.txt') ? filename : `${filename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadTxtNotePad = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.allWardsData) {
          setWards(parsed.wards || initialWardOptions);
          setCurrentWard(parsed.currentWard || initialWardOptions[0]);
          setAllWardsData(parsed.allWardsData);
          if (parsed.stockAuditLogs) setStockAuditLogs(parsed.stockAuditLogs);
          if (parsed.printSettings) setPrintSettings(parsed.printSettings);
          if (parsed.cloudSettings) setCloudSettings(parsed.cloudSettings);
          localStorage.setItem(STORAGE_KEY, text);
          alert('📂 โหลดข้อมูลจากไฟล์ NotePad เรียบร้อยแล้ว!');
        } else {
          alert('รูปแบบไฟล์ไม่ถูกต้อง');
        }
      } catch {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์');
      }
    };
    reader.readAsText(file);
  };

  // --- Cloud Sheets Push & Pull ---
  const handlePushToCloud = async () => {
    if (!cloudSettings.gasUrl) {
      alert('กรุณากรอก Google Apps Script Web App URL ในหน้าตั้งค่า Cloud ก่อน');
      setIsCloudOpen(true);
      return;
    }

    setSaveStatusMsg('⏳ กำลังซิงค์ Sheets...');
    try {
      await fetch(cloudSettings.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          wards,
          currentWard,
          allWardsData,
          stockAuditLogs: stockAuditLogs.slice(0, 100),
          printSettings,
        }),
      });
      setSaveStatusMsg('✓ ซิงค์ Sheets สำเร็จ!');
      alert('✅ ซิงค์ข้อมูลขึ้น Google Sheets สำเร็จ!');
    } catch (err) {
      setSaveStatusMsg('❌ ซิงค์ไม่สำเร็จ');
      alert(`ไม่สามารถเชื่อมต่อ Sheets: ${err}`);
    }
  };

  const handlePullFromCloud = async () => {
    if (!cloudSettings.gasUrl) {
      alert('กรุณากรอก Web App URL ก่อน');
      setIsCloudOpen(true);
      return;
    }
    if (!confirm('การดึงข้อมูลจาก Cloud จะแทนที่ข้อมูลในเครื่อง ต้องการดำเนินการต่อหรือไม่?')) {
      return;
    }

    try {
      const res = await fetch(cloudSettings.gasUrl);
      const result = await res.json();
      if (result.status === 'success' && result.data) {
        const d = result.data;
        if (d.allWardsData) setAllWardsData(d.allWardsData);
        if (d.wards) setWards(d.wards);
        if (d.currentWard) setCurrentWard(d.currentWard);
        if (d.stockAuditLogs) setStockAuditLogs(d.stockAuditLogs);
        if (d.printSettings) setPrintSettings(d.printSettings);
        alert('✅ ดึงข้อมูลจาก Sheets เรียบร้อยแล้ว!');
      } else {
        alert('รูปแบบข้อมูลจาก Cloud ไม่ถูกต้อง');
      }
    } catch (err) {
      alert(`เกิดข้อผิดพลาด: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center pb-24 md:pb-12 font-sans selection:bg-amber-400 selection:text-slate-950">
      <div className="w-full max-w-7xl px-3 sm:px-6 py-4 space-y-4">
        {/* Header & Main Toolbar */}
        <Header
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          wards={wards}
          currentWard={currentWard}
          onSelectWard={handleSelectWard}
          onAddWard={handleAddWard}
          onDeleteWard={handleDeleteWard}
          isCountMode={isCountMode}
          onToggleCountMode={() => setIsCountMode(!isCountMode)}
          onResetCountStatus={handleResetCountStatus}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          saveTarget={saveTarget}
          onSelectSaveTarget={setSaveTarget}
          saveStatusMsg={saveStatusMsg}
          cloudSettings={cloudSettings}
          onOpenScan={() => setIsScanOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAppleScript={() => setIsAppleScriptOpen(true)}
          onOpenImportExcel={() => setIsImportExcelOpen(true)}
          onExportAllExcel={handleExportAllExcel}
          onOpenPrint={() => setIsPrintModalOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenCloud={() => setIsCloudOpen(true)}
          onSaveTxtNotePad={handleSaveTxtNotePad}
          onLoadTxtNotePad={handleLoadTxtNotePad}
        />

        {/* Main Content Area Based on Tab */}
        <main>
          {currentTab === 'cabinets' && (
            <CabinetView
              cabinets={currentWardData.cabinets}
              currentCabIndex={currentCabIndex}
              isCountMode={isCountMode}
              selectedUids={selectedUids}
              theme={printSettings.cardTheme}
              highlightUid={highlightUid}
              onSelectCabinet={setCurrentCabIndex}
              onAddCabinet={handleAddCabinet}
              onRenameCabinet={handleRenameCabinet}
              onDeleteCabinet={handleDeleteCabinet}
              onInsertCabinet={handleInsertCabinet}
              onAddShelf={handleAddShelf}
              onRenameShelf={handleRenameShelf}
              onMoveShelfOrder={handleMoveShelfOrder}
              onDeleteShelf={handleDeleteShelf}
              onClearShelf={handleClearShelf}
              onMoveShelfToCabinet={handleMoveShelfToCabinet}
              onAddItemToShelf={handleAddItemToShelf}
              onToggleItemSelect={handleToggleItemSelect}
              onOpenEditItem={setEditingItem}
              onQuickQtyChange={handleQuickQtyChange}
              onMarkItemCounted={handleMarkItemCounted}
              onOpenLightbox={(imgSrc, name, code) =>
                setLightboxData({ isOpen: true, imgSrc, name, code })
              }
              onPrintShelf={() => setIsPrintModalOpen(true)}
            />
          )}

          {currentTab === 'unassigned' && (
            <UnassignedView
              unassignedItems={currentWardData.unassigned}
              cabinets={currentWardData.cabinets}
              theme={printSettings.cardTheme}
              isCountMode={isCountMode}
              onOpenImportExcel={() => setIsImportExcelOpen(true)}
              onOpenDuplicateModal={() => setIsDuplicateModalOpen(true)}
              onAssignItemsToShelf={handleAssignUnassignedToShelf}
              onDeleteUnassignedItems={handleDeleteUnassignedItems}
              onOpenEditItem={setEditingItem}
              onOpenLightbox={(imgSrc, name, code) =>
                setLightboxData({ isOpen: true, imgSrc, name, code })
              }
              onAddNewUnassignedItem={handleAddNewUnassignedItem}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              currentWard={currentWard}
              cabinets={currentWardData.cabinets}
              printSettings={printSettings}
              onToggleAiMax={(enabled) => {
                const updated = { ...printSettings, allowAiMaxAdjustment: enabled };
                setPrintSettings(updated);
                recordStateChange(allWardsData, stockAuditLogs, wards, currentWard, updated);
              }}
            />
          )}

          {currentTab === 'audit' && (
            <AuditView
              logs={stockAuditLogs}
              onClearLogs={() => {
                setStockAuditLogs([]);
                recordStateChange(allWardsData, []);
              }}
            />
          )}
        </main>
      </div>

      {/* Floating Bulk Move Bar when items are selected */}
      <BulkMoveBar
        selectedCount={selectedUids.length}
        cabinets={currentWardData.cabinets}
        onExecuteBulkMove={handleExecuteBulkMove}
        onClearSelection={() => setSelectedUids([])}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenScan={() => setIsScanOpen(true)}
        onOpenAppleScript={() => setIsAppleScriptOpen(true)}
        onOpenImportExcel={() => setIsImportExcelOpen(true)}
        onExportAllExcel={handleExportAllExcel}
        onOpenPrint={() => setIsPrintModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCloud={() => setIsCloudOpen(true)}
        onSaveTxtNotePad={handleSaveTxtNotePad}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Item Edit Modal */}
      <ItemEditModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        item={editingItem}
        onSave={handleSaveModalItem}
        onOpenLightbox={(imgSrc, name, code) =>
          setLightboxData({ isOpen: true, imgSrc, name, code })
        }
      />

      {/* Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxData.isOpen}
        onClose={() => setLightboxData({ isOpen: false, imgSrc: '', name: '', code: '' })}
        imgSrc={lightboxData.imgSrc}
        name={lightboxData.name}
        code={lightboxData.code}
      />

      {/* Barcode / QR Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onDetected={handleBarcodeDetected}
      />

      {/* AppleScript Browser Launcher Modal */}
      <AppleScriptModal
        isOpen={isAppleScriptOpen}
        onClose={() => setIsAppleScriptOpen(false)}
      />

      {/* Hospital Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportExcelOpen}
        onClose={() => setIsImportExcelOpen(false)}
        existingItems={[
          ...currentWardData.cabinets.flatMap((c) => c.shelves.flatMap((s) => s.items)),
          ...currentWardData.unassigned,
        ]}
        onImportItems={(newItems) => {
          const updatedUnassigned = [...newItems, ...currentWardData.unassigned];
          const updatedWardData: WardData = {
            ...currentWardData,
            unassigned: updatedUnassigned,
          };
          const updatedAll = {
            ...allWardsData,
            [currentWard]: updatedWardData,
          };
          setAllWardsData(updatedAll);
          recordStateChange(updatedAll, stockAuditLogs);
        }}
      />

      {/* Duplicate Report & Cleanup Modal */}
      <DuplicateReportModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        unassignedItems={currentWardData.unassigned}
        onCleanDuplicateGroup={handleCleanDuplicateGroup}
        onCleanAllDuplicates={handleCleanAllDuplicates}
      />

      {/* Print Sheet Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        wardName={currentWard}
        cabinets={currentWardData.cabinets}
        printSettings={printSettings}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={printSettings}
        onSaveSettings={(newSettings) => {
          setPrintSettings(newSettings);
          recordStateChange(allWardsData, stockAuditLogs, wards, currentWard, newSettings);
        }}
      />

      {/* Cloud Google Sheets Modal */}
      <CloudModal
        isOpen={isCloudOpen}
        onClose={() => setIsCloudOpen(false)}
        settings={cloudSettings}
        onSaveSettings={(newSettings) => {
          setCloudSettings(newSettings);
          recordStateChange(allWardsData, stockAuditLogs, wards, currentWard, printSettings, newSettings);
        }}
        onPushToCloud={handlePushToCloud}
        onPullFromCloud={handlePullFromCloud}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        allWardsData={allWardsData}
        onNavigateToItem={(ward, cabIdx, shelfIdx, itemUid) => {
          setCurrentWard(ward);
          setCurrentTab('cabinets');
          setCurrentCabIndex(cabIdx);
          setHighlightUid(itemUid);
          setTimeout(() => setHighlightUid(null), 3000);
        }}
        onOpenLightbox={(imgSrc, name, code) =>
          setLightboxData({ isOpen: true, imgSrc, name, code })
        }
      />
    </div>
  );
}
