import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';

import { GoogleGenAI } from '@google/genai';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { 
    TelegramWebApp, Item, LibraryItem, CompanyProfile, EstimateStatus, ThemeMode, Estimate, Project, FinanceEntry, 
    PhotoReport, Document, WorkStage, Note, InventoryItem, InventoryNote, Task, SettingsModalProps, EstimatesListModalProps, LibraryModalProps, 
    NewProjectModalProps, FinanceEntryModalProps, PhotoReportModalProps, PhotoViewerModalProps, ShoppingListModalProps, 
    DocumentUploadModalProps, WorkStageModalProps, NoteModalProps, ActGenerationModalProps, AISuggestModalProps, 
    EstimateViewProps, ProjectsListViewProps, ProjectDetailViewProps, InventoryViewProps, AddToolModalProps, ReportsViewProps, WorkspaceViewProps, ScratchpadViewProps
} from './types';
import { tg, safeShowAlert, safeShowConfirm, generateNewEstimateNumber, resizeImage, readFileAsDataURL, numberToWordsRu } from './utils';
import { statusMap } from './constants';
import { Icon, IconPlus, IconClose, IconEdit, IconTrash, IconDocument, IconFolder, IconSettings, IconBook, IconClipboard, IconCart, IconDownload, IconPaperclip, IconDragHandle, IconProject, IconChevronRight, IconSparkles, IconSun, IconMoon, IconContrast, IconCreditCard, IconCalendar, IconMessageSquare, IconImage, IconTrendingUp, IconHome } from './components/common/Icon';
import { Loader } from './components/common/Loader';
import { SettingsModal } from './components/modals/SettingsModal';
import { EstimatesListModal } from './components/modals/EstimatesListModal';
import { LibraryModal } from './components/modals/LibraryModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { FinanceEntryModal } from './components/modals/FinanceEntryModal';
import { PhotoReportModal } from './components/modals/PhotoReportModal';
import { PhotoViewerModal } from './components/modals/PhotoViewerModal';
import { ShoppingListModal } from './components/modals/ShoppingListModal';
import { DocumentUploadModal } from './components/modals/DocumentUploadModal';
import { WorkStageModal } from './components/modals/WorkStageModal';
import { NoteModal } from './components/modals/NoteModal';
import { ActGenerationModal } from './components/modals/ActGenerationModal';
import { AISuggestModal } from './components/modals/AISuggestModal';
import { AddToolModal } from './components/modals/AddToolModal';
import { EstimateView } from './components/views/EstimateView';
import { ProjectsListView } from './components/views/ProjectsListView';
import { ProjectDetailView } from './components/views/ProjectDetailView';
import { InventoryView } from './components/views/InventoryView';
import { ReportsView } from './components/views/ReportsView';
import { WorkspaceView } from './components/views/WorkspaceView';
import { ScratchpadView } from './components/views/ScratchpadView';

const App: React.FC = () => {
    // --- App Navigation State ---
    const [activeView, setActiveView] = useState<'workspace' | 'estimate' | 'projects' | 'projectDetail' | 'inventory' | 'reports' | 'scratchpad'>('workspace');

    // --- Data State ---
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [templates, setTemplates] = useState<Omit<Estimate, 'id' | 'clientInfo' | 'number' | 'date' | 'status' | 'projectId'>[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
    const [photoReports, setPhotoReports] = useState<PhotoReport[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [globalDocuments, setGlobalDocuments] = useState<Document[]>([]);
    const [workStages, setWorkStages] = useState<WorkStage[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
    const [companyProfile, setCompanyProfile] = useState<CompanyProfile>({ name: '', details: '', logo: null });
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [inventoryNotes, setInventoryNotes] = useState<InventoryNote[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [taskFilter, setTaskFilter] = useState<TaskFilter>('all');
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [scratchpadItems, setScratchpadItems] = useState<ScratchpadItem[]>([]);
    
    // --- Current Estimate State ---
    const [activeEstimateId, setActiveEstimateId] = useState<number | null>(null);
    const [currentEstimateProjectId, setCurrentEstimateProjectId] = useState<number | null>(null);
    const [items, setItems] = useState<Item[]>([{ id: Date.now(), name: '', quantity: 1, price: 0, unit: '', type: 'material' }]);
    const [clientInfo, setClientInfo] = useState('');
    const [estimateNumber, setEstimateNumber] = useState('');
    const [estimateDate, setEstimateDate] = useState('');
    const [status, setStatus] = useState<EstimateStatus>('draft');
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [tax, setTax] = useState(0);

    // --- Project View State ---
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
    const [projectStatusFilter, setProjectStatusFilter] = useState<'in_progress' | 'completed'>('in_progress');
    const [projectSearch, setProjectSearch] = useState('');
    
    // --- Modals and UI State ---
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isEstimatesListOpen, setIsEstimatesListOpen] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
    const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
    const [isPhotoReportModalOpen, setIsPhotoReportModalOpen] = useState(false);
    const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
    const [isGlobalDocumentModalOpen, setIsGlobalDocumentModalOpen] = useState(false);
    const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);
    const [isWorkStageModalOpen, setIsWorkStageModalOpen] = useState(false);
    const [editingWorkStage, setEditingWorkStage] = useState<Partial<WorkStage> | null>(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
    const [viewingPhoto, setViewingPhoto] = useState<PhotoReport | null>(null);
    const [isActModalOpen, setIsActModalOpen] = useState(false);
    const [isAISuggestModalOpen, setIsAISuggestModalOpen] = useState(false);
    const [isAddToolModalOpen, setIsAddToolModalOpen] = useState(false);
    const [isTaskDetailModalOpen, setIsTaskDetailModalOpen] = useState(false);
    const [isScratchpadModalOpen, setIsScratchpadModalOpen] = useState(false);
    const [actModalTotal, setActModalTotal] = useState(0);
    const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
    const [isDirty, setIsDirty] = useState(false);
    const [isPdfLoading, setIsPdfLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
        const [draggingItem, setDraggingItem] = useState<number | null>(null);

    const lastFocusedElement = useRef<HTMLElement | null>(null);
    const activeModalName = useRef<string | null>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

    // Helper functions for modal management
    const openModal = useCallback((setOpenState: React.Dispatch<React.SetStateAction<boolean>>, modalName: string) => {
        lastFocusedElement.current = document.activeElement as HTMLElement;
        setOpenState(true);
        activeModalName.current = modalName;
    }, []);

    const closeModal = useCallback((setOpenState: React.Dispatch<React.SetStateAction<boolean>>) => {
        setOpenState(false);
        activeModalName.current = null;
        if (lastFocusedElement.current) {
            lastFocusedElement.current.focus();
            lastFocusedElement.current = null;
        }
    }, []);

    const handleOpenTaskDetailModal = (task: Task | null) => {
        setEditingTask(task);
        openModal(setIsTaskDetailModalOpen, 'taskDetail');
    };

    const handleSaveTaskDetail = (taskToSave: Task) => {
        let updatedTasks;
        if (tasks.some(t => t.id === taskToSave.id)) {
            updatedTasks = tasks.map(t => t.id === taskToSave.id ? taskToSave : t);
        } else {
            updatedTasks = [taskToSave, ...tasks];
        }
        setTasks(updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        closeModal(setIsTaskDetailModalOpen);
        setEditingTask(null);
    };

    const handleDeleteTaskDetail = (id: number) => {
        safeShowConfirm("Вы уверены, что хотите удалить эту задачу?", (ok) => {
            if (ok) {
                const updatedTasks = tasks.filter(t => t.id !== id);
                setTasks(updatedTasks);
                localStorage.setItem('tasks', JSON.stringify(updatedTasks));
                closeModal(setIsTaskDetailModalOpen);
                setEditingTask(null);
            }
        });
    };

    // Effect for Escape key to close modals
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                switch (activeModalName.current) {
                    case 'settings': closeModal(setIsSettingsOpen); break;
                    case 'estimatesList': closeModal(setIsEstimatesListOpen); break;
                    case 'library': closeModal(setIsLibraryOpen); break;
                    case 'project': closeModal(setIsProjectModalOpen); break;
                    case 'finance': closeModal(setIsFinanceModalOpen); break;
                    case 'photoReport': closeModal(setIsPhotoReportModalOpen); break;
                    case 'photoViewer': closeModal(setViewingPhoto); break; // Special case for PhotoViewerModal
                    case 'shoppingList': closeModal(setIsShoppingListOpen); break;
                    case 'documentUpload': closeModal(setIsDocumentModalOpen); break;
                    case 'globalDocumentUpload': closeModal(setIsGlobalDocumentModalOpen); break;
                    case 'workStage': closeModal(setIsWorkStageModalOpen); break;
                    case 'note': closeModal(setIsNoteModalOpen); break;
                    case 'act': closeModal(setIsActModalOpen); break;
                    case 'aiSuggest': closeModal(setIsAISuggestModalOpen); break;
                    case 'addTool': closeModal(setIsAddToolModalOpen); break;
                    case 'taskDetail': closeModal(setIsTaskDetailModalOpen); break;
                    default: break;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

    // --- Theme Management ---
    useEffect(() => {
        const savedTheme = localStorage.getItem('themeMode') as ThemeMode | null;
        // Set default to dark if nothing is saved
        const initialTheme = savedTheme || 'dark';
        setThemeMode(initialTheme);
        if (initialTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }, []);

    const handleThemeChange = () => {
        const newTheme: ThemeMode = themeMode === 'light' ? 'dark' : 'light';
        setThemeMode(newTheme);
        localStorage.setItem('themeMode', newTheme);
        if (newTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    };

    useEffect(() => {
        if (isDirty) {
            window.Telegram?.WebApp.enableClosingConfirmation();
        } else {
            window.Telegram?.WebApp.disableClosingConfirmation();
        }
    }, [isDirty]);

    const populateForm = (estimate: Estimate | Partial<Estimate> | null, currentEstimates: Estimate[], projectIdForNew: number | null = null) => {
        if (estimate) {
            setItems(estimate.items || []);
            setClientInfo(estimate.clientInfo || '');
            setEstimateNumber(estimate.number || generateNewEstimateNumber(currentEstimates));
            setEstimateDate(estimate.date || new Date().toISOString().split('T')[0]);
            setStatus(estimate.status || 'draft');
            setDiscount(estimate.discount || 0);
            setDiscountType(estimate.discountType || 'percent');
            setTax(estimate.tax || 0);
            if ('id' in estimate && estimate.id) {
                setActiveEstimateId(estimate.id);
                setCurrentEstimateProjectId(estimate.projectId || null);
            } else {
                 setActiveEstimateId(null);
                 setCurrentEstimateProjectId(projectIdForNew);
            }
        } else {
            // New estimate state
            setItems([{ id: Date.now(), name: '', quantity: 1, price: 0, unit: '', image: null, type: 'work' }]);
            setClientInfo('');
            setEstimateNumber(generateNewEstimateNumber(currentEstimates));
            setEstimateDate(new Date().toISOString().split('T')[0]);
            setStatus('draft');
            setDiscount(0);
            setDiscountType('percent');
            setTax(0);
            setActiveEstimateId(null);
            setCurrentEstimateProjectId(projectIdForNew);
        }
        setIsDirty(false); // Reset dirty flag when loading new data
    };

    // Load all data on initial render
    useEffect(() => {
        try {
            if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.ready();
                window.Telegram.WebApp.expand();
                window.Telegram.WebApp.disableVerticalSwipes();
            }
        } catch (error) {
            console.error("Failed to initialize Telegram Web App:", error);
        }

        const savedData = localStorage.getItem('estimatesData');
        let initialEstimates: Estimate[] = [];
        let activeEstimate: Estimate | null = null;
        
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                let savedEstimates = (parsedData.estimates || []) as Estimate[];
                const savedActiveId = parsedData.activeEstimateId;
                
                let needsResave = false;
                savedEstimates = savedEstimates.map((e: any) => {
                    let updated = { ...e };
                    if (typeof e.status === 'undefined') {
                        needsResave = true;
                        updated = {
                            ...updated,
                            number: e.number || generateNewEstimateNumber([]),
                            date: e.date || new Date(e.lastModified).toISOString().split('T')[0],
                            status: 'draft',
                        };
                    }
                    if (typeof e.projectId === 'undefined') {
                        needsResave = true;
                        updated.projectId = null;
                    }
                    // Data migration for item type
                    if (e.items && e.items.some((i: any) => typeof i.type === 'undefined')) {
                        needsResave = true;
                        updated.items = e.items.map((i: any) => ({ ...i, type: i.type || 'material' }));
                    }

                    return updated;
                });
                
                if (needsResave) localStorage.setItem('estimatesData', JSON.stringify({ estimates: savedEstimates, activeEstimateId: savedActiveId }));
                
                initialEstimates = savedEstimates;
                activeEstimate = savedEstimates.find(e => e.id === savedActiveId) || savedEstimates[0] || null;

            } catch (error) { console.error("Failed to parse saved estimates:", error); }
        }
        
        setEstimates(initialEstimates);
        // On first load, if no project is associated with the active estimate, don't populate. Let user start from projects view.
        if (activeEstimate && activeEstimate.projectId) {
            populateForm(activeEstimate, initialEstimates);
        } else {
             populateForm(null, initialEstimates);
        }
        
        const savedProfile = localStorage.getItem('companyProfile');
        if (savedProfile) { try { setCompanyProfile(JSON.parse(savedProfile)); } catch (e) { console.error("Failed to parse profile", e); }}
        
        const savedLibrary = localStorage.getItem('itemLibrary');
        if (savedLibrary) { try { setLibraryItems(JSON.parse(savedLibrary)); } catch (e) { console.error("Failed to parse library", e); }}

        const savedTemplates = localStorage.getItem('estimateTemplates');
        if (savedTemplates) { try { setTemplates(JSON.parse(savedTemplates)); } catch (e) { console.error("Failed to parse templates", e); }}
        
        const savedProjects = localStorage.getItem('projects');
        if (savedProjects) { try { setProjects(JSON.parse(savedProjects)); } catch (e) { console.error("Failed to parse projects", e); } } 
        
        const savedFinances = localStorage.getItem('financeEntries');
        if (savedFinances) { try { setFinanceEntries(JSON.parse(savedFinances)); } catch (e) { console.error("Failed to parse finances", e); } }

        const savedPhotos = localStorage.getItem('photoReports');
        if (savedPhotos) { try { setPhotoReports(JSON.parse(savedPhotos)); } catch (e) { console.error("Failed to parse photos", e); } }

        const savedDocuments = localStorage.getItem('projectDocuments');
        if (savedDocuments) { try { setDocuments(JSON.parse(savedDocuments)); } catch (e) { console.error("Failed to parse documents", e); } }

        const savedGlobalDocuments = localStorage.getItem('globalDocuments');
        if (savedGlobalDocuments) { try { setGlobalDocuments(JSON.parse(savedGlobalDocuments)); } catch (e) { console.error("Failed to parse global documents", e); } }

        const savedWorkStages = localStorage.getItem('workStages');
        if (savedWorkStages) { try { setWorkStages(JSON.parse(savedWorkStages)); } catch (e) { console.error("Failed to parse work stages", e); } }

        const savedNotes = localStorage.getItem('projectNotes');
        if (savedNotes) { try { setNotes(JSON.parse(savedNotes)); } catch (e) { console.error("Failed to parse notes", e); } }

        const savedInventoryItems = localStorage.getItem('inventoryItems');
        if (savedInventoryItems) { try { setInventoryItems(JSON.parse(savedInventoryItems)); } catch (e) { console.error("Failed to parse inventory items", e); } }

        const savedInventoryNotes = localStorage.getItem('inventoryNotes');
        if (savedInventoryNotes) { try { setInventoryNotes(JSON.parse(savedInventoryNotes)); } catch (e) { console.error("Failed to parse inventory notes", e); } }

        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) { try { setTasks(JSON.parse(savedTasks)); } catch (e) { console.error("Failed to parse tasks", e); } }

        const savedScratchpad = localStorage.getItem('scratchpad');
        if (savedScratchpad) {
            try {
                const parsedScratchpad = JSON.parse(savedScratchpad);
                if (Array.isArray(parsedScratchpad)) {
                    setScratchpadItems(parsedScratchpad);
                } else {
                    // Migrate old string scratchpad to new checklist format
                    setScratchpadItems([{ id: Date.now(), text: parsedScratchpad, completed: false }]);
                }
            } catch (e) {
                // If parsing fails, it's likely an old string format
                setScratchpadItems([{ id: Date.now(), text: savedScratchpad, completed: false }]);
            }
        }

    }, []);
    
    const handleInputFocus = (e: React.FocusEvent<HTMLElement>) => {
        setTimeout(() => {
            const inputElement = e.target;
            
            // Используем scrollIntoView для более надежного позиционирования
            inputElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
            
            // Дополнительная проверка для мобильных устройств
            setTimeout(() => {
                const rect = inputElement.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const safeArea = viewportHeight * 0.3; // Безопасная зона в верхней части экрана
                
                // Если поле ввода находится в нижней части экрана, прокручиваем еще больше
                if (rect.top > viewportHeight - safeArea) {
                    window.scrollBy({
                        top: rect.top - safeArea,
                        behavior: 'smooth'
                    });
                }
            }, 100);
        }, 300); // Уменьшенная задержка для более быстрой реакции
    };

    const handleAddItem = () => { setItems(prev => [...prev, { id: Date.now(), name: '', quantity: 1, price: 0, unit: '', image: null, type: 'work' }]); setIsDirty(true); };
    const handleAddFromLibrary = (libItem: LibraryItem) => { setItems(prev => [...prev, { id: Date.now(), name: libItem.name, quantity: 1, price: libItem.price, unit: libItem.unit, image: null, type: 'work' }]); setIsLibraryOpen(false); setIsDirty(true); };
    const handleAddItemsFromAI = (newItems: Omit<Item, 'id' | 'image' | 'type'>[]) => {
        const itemsToAdd: Item[] = newItems.map(item => ({
            ...item,
            id: Date.now() + Math.random(),
            image: null,
            type: 'work' // Default type, user can change it
        }));
        setItems(prev => [...prev, ...itemsToAdd]);
        setIsDirty(true);
    };

    const handleItemChange = (id: number, field: keyof Item, value: string | number) => { setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item)); setIsDirty(true); };
    const handleRemoveItem = (id: number) => { setItems(prev => prev.filter(item => item.id !== id)); setIsDirty(true); };
    
    const handleDragSort = () => {
        if (dragItem.current === null || dragOverItem.current === null || dragItem.current === dragOverItem.current) return;
        const newItems = [...items];
        const dragItemContent = newItems.splice(dragItem.current, 1)[0];
        newItems.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setItems(newItems);
        setIsDirty(true);
    };

    const handleItemImageChange = async (id: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const resizedImage = await resizeImage(file, 800); // Resize to max 800px
            setItems(prev => prev.map(item => item.id === id ? { ...item, image: resizedImage } : item));
            setIsDirty(true);
        } catch (error) {
            console.error("Image processing failed:", error);
            safeShowAlert("Не удалось обработать изображение.");
        }
    };
    
    const handleRemoveItemImage = (id: number) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, image: null } : item));
        setIsDirty(true);
    };

    const calculation = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price)), 0);
        const materialsTotal = items.filter(item => item.type === 'material').reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price)), 0);
        const workTotal = items.filter(item => item.type === 'work').reduce((acc, item) => acc + (Number(item.quantity) * Number(item.price)), 0);
        const discountAmount = discountType === 'percent' ? subtotal * (Number(discount) / 100) : Number(discount);
        const totalAfterDiscount = subtotal - discountAmount;
        const taxAmount = totalAfterDiscount * (Number(tax) / 100);
        const grandTotal = totalAfterDiscount + taxAmount;
        return { subtotal, materialsTotal, workTotal, discountAmount, taxAmount, grandTotal };
    }, [items, discount, discountType, tax]);

    const formatCurrency = useCallback((value: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(value), []);
    const getValidItems = useCallback(() => items.filter(item => item.name.trim() && item.quantity > 0 && item.price >= 0), [items]);

    const handleSave = () => {
        if (!isDirty) return;
        setIsSaving(true);
        try {
            const newEstimates = [...estimates];
            const now = Date.now();
            const currentId = activeEstimateId || now;
            
            const currentEstimateData: Estimate = { 
                id: currentId,
                clientInfo, items, discount, discountType, tax, 
                number: estimateNumber, date: estimateDate, status,
                projectId: currentEstimateProjectId,
                lastModified: now
            };
    
            const existingIndex = newEstimates.findIndex(e => e.id === activeEstimateId);
            if (existingIndex > -1) {
                newEstimates[existingIndex] = currentEstimateData;
            } else {
                newEstimates.unshift(currentEstimateData);
            }

            setEstimates(newEstimates);
            setActiveEstimateId(currentId);
            localStorage.setItem('estimatesData', JSON.stringify({ estimates: newEstimates, activeEstimateId: currentId }));
            setIsDirty(false); // Reset dirty flag after successful save
            tg?.HapticFeedback.notificationOccurred('success');
        } catch (error) {
            console.error("Save failed:", error);
            safeShowAlert("Не удалось сохранить смету.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleNewEstimate = (template?: Omit<Estimate, 'id' | 'clientInfo' | 'number' | 'date' | 'status' | 'projectId'>) => {
        if (isDirty) {
            safeShowConfirm('У вас есть несохраненные изменения. Вы уверены, что хотите создать новую смету?', (ok) => {
                if (ok) {
                    populateForm(template || null, estimates, null);
                }
            });
        } else {
             populateForm(template || null, estimates, null);
        }
    }
    
    const handleExportPDF = useCallback(async () => {
        setIsPdfLoading(true);
        tg?.HapticFeedback.notificationOccurred('warning');
        try {
            const doc = new jsPDF();

            const validItems = getValidItems();
            if (validItems.length === 0) {
                safeShowAlert("Добавьте хотя бы одну позицию в смету.");
                return;
            }
        
            // Используем встроенный шрифт Helvetica для лучшей совместимости
            doc.setFont('helvetica');
        
            let y = 15;
            const pageMargin = 15;
            const pageWidth = doc.internal.pageSize.getWidth();
        
            // Header
            if (companyProfile.logo) {
                try {
                    doc.addImage(companyProfile.logo, 'JPEG', pageMargin, y, 30, 30);
                } catch (e) { console.error("Could not add logo to PDF:", e); }
            }
            
            doc.setFontSize(20);
            doc.text(companyProfile.name || 'Смета', pageWidth - pageMargin, y + 5, { align: 'right' });
            doc.setFontSize(10);
            doc.text(companyProfile.details || '', pageWidth - pageMargin, y + 15, { align: 'right', maxWidth: 80 });
            y += 45;
        
            // Estimate Meta
            doc.setFontSize(16);
            doc.text(`Смета № ${estimateNumber} от ${new Date(estimateDate).toLocaleDateString('ru-RU')}`, pageMargin, y);
            y += 10;
            doc.setFontSize(12);
            doc.text(`Клиент / Объект: ${clientInfo}`, pageMargin, y);
            y += 15;
            
            // Table
            const tableData = validItems.map((item, index) => [
                index + 1,
                item.name,
                item.quantity,
                item.unit || 'шт.',
                formatCurrency(item.price),
                formatCurrency(item.quantity * item.price),
            ]);
        
            (doc as any).autoTable({
                startY: y,
                head: [['№', 'Наименование', 'Кол-во', 'Ед.изм.', 'Цена', 'Сумма']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255, font: 'helvetica' },
                bodyStyles: { font: 'helvetica' },
                didDrawPage: (data: any) => y = data.cursor.y,
            });
            
            y = (doc as any).autoTable.previous.finalY + 15;
        
            // Totals
            const totalsX = pageWidth - pageMargin;
            doc.setFontSize(12);
            doc.text(`Подытог: ${formatCurrency(calculation.subtotal)}`, totalsX, y, { align: 'right' });
            y += 7;
            if (calculation.discountAmount > 0) {
                doc.text(`Скидка (${discountType === 'percent' ? `${discount}%` : formatCurrency(discount)}): -${formatCurrency(calculation.discountAmount)}`, totalsX, y, { align: 'right' });
                y += 7;
            }
            if (calculation.taxAmount > 0) {
                doc.text(`Налог (${tax}%): +${formatCurrency(calculation.taxAmount)}`, totalsX, y, { align: 'right' });
                y += 7;
            }
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Итого: ${formatCurrency(calculation.grandTotal)}`, totalsX, y + 2, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            
            // Images
            const images = validItems.filter(item => item.image);
            if (images.length > 0) {
                doc.addPage();
                let imageY = 15;
                doc.setFontSize(16);
                doc.text('Прикрепленные изображения', pageMargin, imageY);
                imageY += 10;
                
                for (const item of images) {
                    if (!item.image) continue;
                    doc.setFontSize(10);
                    doc.text(`Позиция #${validItems.indexOf(item) + 1}: ${item.name}`, pageMargin, imageY);
                    imageY += 5;
                    try {
                        const imgProps = doc.getImageProperties(item.image);
                        const aspect = imgProps.width / imgProps.height;
                        const maxWidth = pageWidth - pageMargin * 2;
                        const maxHeight = 80;
                        let imgWidth = maxWidth;
                        let imgHeight = imgWidth / aspect;
                        if (imgHeight > maxHeight) {
                            imgHeight = maxHeight;
                            imgWidth = imgHeight * aspect;
                        }
                        if (imageY + imgHeight > doc.internal.pageSize.getHeight() - pageMargin) {
                            doc.addPage();
                            imageY = pageMargin;
                        }
                        doc.addImage(item.image, 'JPEG', pageMargin, imageY, imgWidth, imgHeight);
                        imageY += imgHeight + 10;
                    } catch (e) {
                        console.error("Could not add item image to PDF:", e);
                        doc.setTextColor(150);
                        doc.text('Не удалось загрузить изображение.', pageMargin, imageY);
                        doc.setTextColor(0);
                        imageY += 10;
                    }
                }
            }
        
            doc.save(`смета-${estimateNumber}.pdf`);
        } catch (error: any) {
            console.error("PDF Export failed:", error);
            safeShowAlert(`Не удалось создать PDF: ${error.message}`);
        } finally {
            setIsPdfLoading(false);
        }
    }, [getValidItems, clientInfo, companyProfile, estimateNumber, estimateDate, formatCurrency, calculation, discount, discountType, tax]);

    const handleShare = useCallback(() => {
        try {
            const validItems = getValidItems();
            if (validItems.length === 0) {
                safeShowAlert("Добавьте хотя бы одну позицию, чтобы поделиться сметой.");
                tg?.HapticFeedback.notificationOccurred('error');
                return;
            }
            const header = `*Смета № ${estimateNumber} от ${new Date(estimateDate).toLocaleDateString('ru-RU')}*
Клиент: ${clientInfo || 'Не указан'}

`;
            const itemsText = validItems.map((item, index) => `${index + 1}. ${item.name} (${item.quantity} ${item.unit || 'шт.'}) - ${formatCurrency(item.quantity * item.price)}`).join('\n');
            const footer = `

*Подытог:* ${formatCurrency(calculation.subtotal)}`;
            const discountText = calculation.discountAmount > 0 ? `
*Скидка:* -${formatCurrency(calculation.discountAmount)}` : '';
            const taxText = calculation.taxAmount > 0 ? `
*Налог (${tax}%):* +${formatCurrency(calculation.taxAmount)}` : '';
            const total = `
*Итого:* ${formatCurrency(calculation.grandTotal)}`;
            
            const message = header + itemsText + footer + discountText + taxText + total;
            window.Telegram?.WebApp.sendData(message);
        } catch (error) {
            console.error("Share failed:", error);
            safeShowAlert("Не удалось подготовить данные для отправки.");
        }
    }, [getValidItems, estimateNumber, estimateDate, clientInfo, formatCurrency, calculation, tax]);
    
    const handleProfileChange = (field: keyof CompanyProfile, value: string) => setCompanyProfile(prev => ({ ...prev, [field]: value }));
    const handleSaveProfile = () => { localStorage.setItem('companyProfile', JSON.stringify(companyProfile)); closeModal(setIsSettingsOpen); tg?.HapticFeedback.notificationOccurred('success'); };
    
    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const resizedLogo = await resizeImage(file, 200); // Resize to max 200px for profile
            setCompanyProfile(prev => ({ ...prev, logo: resizedLogo }));
        } catch (error) {
            console.error("Logo processing failed:", error);
            safeShowAlert("Не удалось обработать логотип.");
        }
    };
    const removeLogo = () => setCompanyProfile(prev => ({...prev, logo: null}));

    const handleLoadEstimate = (id: number) => {
        const load = () => {
            const estimateToLoad = estimates.find(e => e.id === id); 
            if (estimateToLoad) { 
                populateForm(estimateToLoad, estimates);
                closeModal(setIsEstimatesListOpen);
                // If we're loading from a project, switch to the estimate view
                if (activeView === 'projectDetail') {
                    setActiveView('estimate');
                }
            }
        };

        if (isDirty) {
            safeShowConfirm("У вас есть несохраненные изменения. Загрузить другую смету?", (ok) => {
                if (ok) load();
            });
        } else {
            load();
        }
    };
    
    const handleDeleteEstimate = (id: number) => {
        safeShowConfirm("Вы уверены, что хотите удалить эту смету?", (ok) => {
            if (ok) {
                tg?.HapticFeedback.notificationOccurred('warning');
                const newEstimates = estimates.filter(e => e.id !== id);
                setEstimates(newEstimates);
                let newActiveId = activeEstimateId;
                if (activeEstimateId === id) {
                    const estimateToLoad = newEstimates.find(e => e.projectId === currentEstimateProjectId) || newEstimates[0] || null;
                    newActiveId = estimateToLoad ? estimateToLoad.id : null;
                    populateForm(estimateToLoad, newEstimates);
                }
                localStorage.setItem('estimatesData', JSON.stringify({ estimates: newEstimates, activeEstimateId: newActiveId }));
            }
        });

    };
    
    const handleStatusChange = (id: number, newStatus: EstimateStatus) => {
        const newEstimates = estimates.map(e => e.id === id ? { ...e, status: newStatus } : e);
        setEstimates(newEstimates);
        localStorage.setItem('estimatesData', JSON.stringify({ estimates: newEstimates, activeEstimateId }));
        if (id === activeEstimateId) {
            setStatus(newStatus);
        }
    };

    const handleSaveAsTemplate = (id: number) => {
        const estimateToSave = estimates.find(e => e.id === id);
        if (estimateToSave) {
            const newTemplate = {
                items: estimateToSave.items,
                discount: estimateToSave.discount,
                discountType: estimateToSave.discountType,
                tax: estimateToSave.tax,
                lastModified: Date.now()
            };
            const newTemplates = [...templates, newTemplate];
            setTemplates(newTemplates);
            localStorage.setItem('estimateTemplates', JSON.stringify(newTemplates));
            safeShowAlert('Шаблон сохранен!');
            tg?.HapticFeedback.notificationOccurred('success');
        }
    };

    const handleDeleteTemplate = (timestamp: number) => {
        safeShowConfirm('Вы уверены, что хотите удалить этот шаблон?', (ok) => {
            if (ok) {
                const newTemplates = templates.filter(t => t.lastModified !== timestamp);
                setTemplates(newTemplates);
                localStorage.setItem('estimateTemplates', JSON.stringify(newTemplates));
            }
        });
    };

    // --- Project Management ---
    const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);
    const filteredProjects = useMemo(() => {
        return projects
            .filter(p => p.status === projectStatusFilter)
            .filter(p => 
                p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                p.client.toLowerCase().includes(projectSearch.toLowerCase()) ||
                p.address.toLowerCase().includes(projectSearch.toLowerCase())
            );
    }, [projects, projectStatusFilter, projectSearch]);

    const handleOpenProjectModal = (project: Partial<Project> | null = null) => {
        setEditingProject(project || { name: '', client: '', address: '', status: 'in_progress' });
        openModal(setIsProjectModalOpen, 'project');
    };

    const handleSaveProject = () => {
        if (!editingProject || !editingProject.name?.trim()) {
            safeShowAlert('Введите название проекта.');
            return;
        }
        let updatedProjects;
        if (editingProject.id) { // Update existing
            updatedProjects = projects.map(p => p.id === editingProject.id ? editingProject as Project : p);
        } else { // Create new
            const newProject: Project = {
                id: Date.now(),
                name: editingProject.name.trim(),
                client: editingProject.client?.trim() || '',
                address: editingProject.address?.trim() || '',
                status: 'in_progress'
            };
            updatedProjects = [newProject, ...projects];
        }
        setProjects(updatedProjects);
        localStorage.setItem('projects', JSON.stringify(updatedProjects));
        closeModal(setIsProjectModalOpen);
        setEditingProject(null);
    };

    const handleDeleteProject = (id: number) => {
        safeShowConfirm('Вы уверены, что хотите удалить проект и все связанные с ним данные (сметы, финансы и т.д.)?', (ok) => {
            if (ok) {
                // Delete project and all associated data
                const newProjects = projects.filter(p => p.id !== id);
                const newEstimates = estimates.filter(e => e.projectId !== id);
                const newFinances = financeEntries.filter(f => f.projectId !== id);
                const newPhotos = photoReports.filter(ph => ph.projectId !== id);
                const newDocs = documents.filter(d => d.projectId !== id);
                const newStages = workStages.filter(ws => ws.projectId !== id);
                const newNotes = notes.filter(n => n.projectId !== id);

                setProjects(newProjects);
                setEstimates(newEstimates);
                setFinanceEntries(newFinances);
                setPhotoReports(newPhotos);
                setDocuments(newDocs);
                setWorkStages(newStages);
                setNotes(newNotes);

                localStorage.setItem('projects', JSON.stringify(newProjects));
                localStorage.setItem('estimatesData', JSON.stringify({ estimates: newEstimates, activeEstimateId }));
                localStorage.setItem('financeEntries', JSON.stringify(newFinances));
                localStorage.setItem('photoReports', JSON.stringify(newPhotos));
                localStorage.setItem('projectDocuments', JSON.stringify(newDocs));
                localStorage.setItem('workStages', JSON.stringify(newStages));
                localStorage.setItem('projectNotes', JSON.stringify(newNotes));

                setActiveView('projects');
                setActiveProjectId(null);
            }
        });
    };

    const handleAddNewEstimateForProject = () => {
        if (isDirty) {
            safeShowConfirm('У вас есть несохраненные изменения. Создать новую смету для этого проекта?', (ok) => {
                if (ok) {
                    populateForm(null, estimates, activeProjectId);
                    setActiveView('estimate');
                }
            });
        } else {
            populateForm(null, estimates, activeProjectId);
            setActiveView('estimate');
        }
    };

    const handleBackToProject = () => {
        if (isDirty) {
            safeShowConfirm('У вас есть несохраненные изменения. Вернуться к проекту без сохранения?', (ok) => {
                if (ok) {
                    setIsDirty(false); // Discard changes
                    setActiveView('projectDetail');
                }
            });
        } else {
            setActiveView('projectDetail');
        }
    };

    // --- Finance Management ---
    const handleSaveFinanceEntry = (entry: Omit<FinanceEntry, 'id' | 'projectId'>) => {
        if (!activeProjectId) return;
        const newEntry: FinanceEntry = { ...entry, id: Date.now(), projectId: activeProjectId };
        const updatedEntries = [newEntry, ...financeEntries];
        setFinanceEntries(updatedEntries);
        localStorage.setItem('financeEntries', JSON.stringify(updatedEntries));
        closeModal(setIsFinanceModalOpen);
    };
    const handleDeleteFinanceEntry = (id: number) => {
        const updatedEntries = financeEntries.filter(f => f.id !== id);
        setFinanceEntries(updatedEntries);
        localStorage.setItem('financeEntries', JSON.stringify(updatedEntries));
    };

    // --- Photo Report Management ---
    const handleSavePhotoReport = (photo: Omit<PhotoReport, 'id' | 'projectId'>) => {
        if (!activeProjectId) return;
        const newPhoto: PhotoReport = { ...photo, id: Date.now(), projectId: activeProjectId };
        const updatedPhotos = [newPhoto, ...photoReports];
        setPhotoReports(updatedPhotos);
        localStorage.setItem('photoReports', JSON.stringify(updatedPhotos));
        closeModal(setIsPhotoReportModalOpen);
    };
    const handleDeletePhoto = (id: number) => {
        const updatedPhotos = photoReports.filter(p => p.id !== id);
        setPhotoReports(updatedPhotos);
        localStorage.setItem('photoReports', JSON.stringify(updatedPhotos));
        closeModal(setViewingPhoto); // Special case for PhotoViewerModal
    };

    // --- Document Management ---
    const handleSaveDocument = (name: string, dataUrl: string) => {
        if (!activeProjectId) return;
        const newDoc: Document = { id: Date.now(), projectId: activeProjectId, name, dataUrl, date: new Date().toISOString() };
        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);
        localStorage.setItem('projectDocuments', JSON.stringify(updatedDocs));
        closeModal(setIsDocumentModalOpen);
    };
    const handleDeleteDocument = (id: number) => {
        const updatedDocs = documents.filter(d => d.id !== id);
        setDocuments(updatedDocs);
        localStorage.setItem('projectDocuments', JSON.stringify(updatedDocs));
    };

    const handleSaveGlobalDocument = (name: string, dataUrl: string) => {
        const newDoc: Document = { id: Date.now(), name, dataUrl, date: new Date().toISOString() };
        const updatedDocs = [newDoc, ...globalDocuments];
        setGlobalDocuments(updatedDocs);
        localStorage.setItem('globalDocuments', JSON.stringify(updatedDocs));
        closeModal(setIsGlobalDocumentModalOpen);
    };

    const handleDeleteGlobalDocument = (id: number) => {
        const updatedDocs = globalDocuments.filter(d => d.id !== id);
        setGlobalDocuments(updatedDocs);
        localStorage.setItem('globalDocuments', JSON.stringify(updatedDocs));
    };

    // --- Work Stage Management ---
    const handleOpenWorkStageModal = (stage: Partial<WorkStage> | null) => {
        setEditingWorkStage(stage);
        openModal(setIsWorkStageModalOpen, 'workStage');
    };
    const handleSaveWorkStage = (stageData: Omit<WorkStage, 'id' | 'projectId'>) => {
        if (!activeProjectId) return;
        let updatedStages;
        if (editingWorkStage?.id) {
            updatedStages = workStages.map(ws => ws.id === editingWorkStage.id ? { ...ws, ...stageData } : ws);
        } else {
            const newStage: WorkStage = { ...stageData, id: Date.now(), projectId: activeProjectId };
            updatedStages = [newStage, ...workStages];
        }
        setWorkStages(updatedStages);
        localStorage.setItem('workStages', JSON.stringify(updatedStages));
        closeModal(setIsWorkStageModalOpen);
        setEditingWorkStage(null);
    };
    const handleDeleteWorkStage = (id: number) => {
        const updatedStages = workStages.filter(ws => ws.id !== id);
        setWorkStages(updatedStages);
        localStorage.setItem('workStages', JSON.stringify(updatedStages));
    };

    // --- Note Management ---
    const handleOpenNoteModal = (note: Partial<Note> | null) => {
        setEditingNote(note);
        openModal(setIsNoteModalOpen, 'note');
    };
    const handleSaveNote = (text: string) => {
        if (!activeProjectId) return;
        let updatedNotes;
        if (editingNote?.id) {
            updatedNotes = notes.map(n => n.id === editingNote.id ? { ...n, text, lastModified: Date.now() } : n);
        } else {
            const newNote: Note = { text, id: Date.now(), projectId: activeProjectId, lastModified: Date.now() };
            updatedNotes = [newNote, ...notes];
        }
        setNotes(updatedNotes);
        localStorage.setItem('projectNotes', JSON.stringify(updatedNotes));
        closeModal(setIsNoteModalOpen);
        setEditingNote(null);
    };
    const handleDeleteNote = (id: number) => {
        const updatedNotes = notes.filter(n => n.id !== id);
        setNotes(updatedNotes);
        localStorage.setItem('projectNotes', JSON.stringify(updatedNotes));
    };

    // --- Inventory Management ---
    const handleAddInventoryItem = (item: Omit<InventoryItem, 'id'>) => {
        const newItem: InventoryItem = { ...item, id: Date.now() };
        const updatedItems = [newItem, ...inventoryItems];
        setInventoryItems(updatedItems);
        localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
    };

    const handleUpdateInventoryItem = (item: InventoryItem) => {
        const updatedItems = inventoryItems.map(i => i.id === item.id ? i : i);
        setInventoryItems(updatedItems);
        localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
    };

    const handleDeleteInventoryItem = (id: number) => {
        const updatedItems = inventoryItems.filter(i => i.id !== id);
        setInventoryItems(updatedItems);
        localStorage.setItem('inventoryItems', JSON.stringify(updatedItems));
    };

    const handleAddInventoryNote = (note: Omit<InventoryNote, 'id' | 'date'>) => {
        const newNote: InventoryNote = { ...note, id: Date.now(), date: new Date().toISOString() };
        const updatedNotes = [newNote, ...inventoryNotes];
        setInventoryNotes(updatedNotes);
        localStorage.setItem('inventoryNotes', JSON.stringify(updatedNotes));
    };

    const handleDeleteInventoryNote = (id: number) => {
        const updatedNotes = inventoryNotes.filter(n => n.id !== id);
        setInventoryNotes(updatedNotes);
        localStorage.setItem('inventoryNotes', JSON.stringify(updatedNotes));
    };

    // --- Workspace Handlers ---
    const handleAddTask = (text: string) => {
        const today = new Date().toISOString().split('T')[0];
        const newTask: Task = { id: Date.now(), text, completed: false, dueDate: today, projectId: undefined };
        const updatedTasks = [newTask, ...tasks];
        setTasks(updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    };

    const handleToggleTask = (id: number) => {
        const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        setTasks(updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    };

    const handleDeleteTask = (id: number) => {
        const updatedTasks = tasks.filter(t => t.id !== id);
        setTasks(updatedTasks);
        localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    };

    const handleAddScratchpadItem = (text: string) => {
        const newItem = { id: Date.now(), text, completed: false };
        const updatedItems = [...scratchpadItems, newItem];
        setScratchpadItems(updatedItems);
        localStorage.setItem('scratchpad', JSON.stringify(updatedItems));
    };

    const handleToggleScratchpadItem = (id: number) => {
        const updatedItems = scratchpadItems.map(item => 
            item.id === id ? { ...item, completed: !item.completed } : item
        );
        setScratchpadItems(updatedItems);
        localStorage.setItem('scratchpad', JSON.stringify(updatedItems));
    };

    const handleDeleteScratchpadItem = (id: number) => {
        const updatedItems = scratchpadItems.filter(item => item.id !== id);
        setScratchpadItems(updatedItems);
        localStorage.setItem('scratchpad', JSON.stringify(updatedItems));
    };

    const handleBackup = () => {
        const backupData = {
            estimates,
            templates,
            projects,
            financeEntries,
            photoReports,
            documents,
            workStages,
            notes,
            libraryItems,
            companyProfile,
            tasks,
            scratchpadItems,
        };

        const json = JSON.stringify(backupData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `smetaza5minut_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const restoredData = JSON.parse(json);

                setEstimates(restoredData.estimates || []);
                setTemplates(restoredData.templates || []);
                setProjects(restoredData.projects || []);
                setFinanceEntries(restoredData.financeEntries || []);
                setPhotoReports(restoredData.photoReports || []);
                setDocuments(restoredData.documents || []);
                setWorkStages(restoredData.workStages || []);
                setNotes(restoredData.notes || []);
                setLibraryItems(restoredData.libraryItems || []);
                setCompanyProfile(restoredData.companyProfile || { name: '', details: '', logo: null });
                setTasks(restoredData.tasks || []);
                setScratchpadItems(restoredData.scratchpadItems || []);

                localStorage.setItem('estimatesData', JSON.stringify({ estimates: restoredData.estimates || [], activeEstimateId: null }));
                localStorage.setItem('estimateTemplates', JSON.stringify(restoredData.templates || []));
                localStorage.setItem('projects', JSON.stringify(restoredData.projects || []));
                localStorage.setItem('financeEntries', JSON.stringify(restoredData.financeEntries || []));
                localStorage.setItem('photoReports', JSON.stringify(restoredData.photoReports || []));
                localStorage.setItem('projectDocuments', JSON.stringify(restoredData.documents || []));
                localStorage.setItem('workStages', JSON.stringify(restoredData.workStages || []));
                localStorage.setItem('projectNotes', JSON.stringify(restoredData.notes || []));
                localStorage.setItem('itemLibrary', JSON.stringify(restoredData.libraryItems || []));
                localStorage.setItem('companyProfile', JSON.stringify(restoredData.companyProfile || { name: '', details: '', logo: null }));
                localStorage.setItem('tasks', JSON.stringify(restoredData.tasks || []));
                localStorage.setItem('scratchpad', JSON.stringify(restoredData.scratchpadItems || []));

                safeShowAlert('Данные успешно восстановлены!');
            } catch (error) {
                safeShowAlert('Ошибка при восстановлении данных. Убедитесь, что вы выбрали правильный файл резервной копии.');
                console.error("Restore failed:", error);
            }
        };
        reader.readAsText(file);
    };

    // --- Act Generation ---
    const handleOpenActModal = (total: number) => {
        setActModalTotal(total);
        openModal(setIsActModalOpen, 'act');
    };

    const filteredTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // End of current week (Sunday)

        return tasks.filter(task => {
            if (taskFilter === 'all') return true;
            if (taskFilter === 'completed') return task.completed;
            if (task.completed) return false; // Don't show completed tasks in other filters

            const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
            if (!taskDueDate) return false; // Tasks without due date are not filtered by date

            taskDueDate.setHours(0, 0, 0, 0);

            if (taskFilter === 'today') {
                return taskDueDate.getTime() === today.getTime();
            }
            if (taskFilter === 'week') {
                return taskDueDate.getTime() >= today.getTime() && taskDueDate.getTime() <= endOfWeek.getTime();
            }
            if (taskFilter === 'overdue') {
                return taskDueDate.getTime() < today.getTime();
            }
            return true;
        });
    }, [tasks, taskFilter]);

    const themeIcon = useCallback(() => {
        return themeMode === 'light' ? <IconSun /> : <IconMoon />;
    }, [themeMode]);

    const filteredTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // End of current week (Sunday)

        return tasks.filter(task => {
            if (taskFilter === 'all') return true;
            if (taskFilter === 'completed') return task.completed;
            if (task.completed) return false; // Don't show completed tasks in other filters

            const taskDueDate = task.dueDate ? new Date(task.dueDate) : null;
            if (!taskDueDate) return false; // Tasks without due date are not filtered by date

            taskDueDate.setHours(0, 0, 0, 0);

            if (taskFilter === 'today') {
                return taskDueDate.getTime() === today.getTime();
            }
            if (taskFilter === 'week') {
                return taskDueDate.getTime() >= today.getTime() && taskDueDate.getTime() <= endOfWeek.getTime();
            }
            if (taskFilter === 'overdue') {
                return taskDueDate.getTime() < today.getTime();
            }
            return true;
        });
    }, [tasks, taskFilter]);

    const renderView = () => {
        switch (activeView) {
            case 'workspace':
                return <WorkspaceView 
                    tasks={filteredTasks}
                    scratchpadItems={scratchpadItems}
                    globalDocuments={globalDocuments}
                    projects={projects}
                    taskFilter={taskFilter}
                    setTaskFilter={setTaskFilter}
                    onAddTask={handleAddTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                    onOpenTaskDetailModal={handleOpenTaskDetailModal}
                    onAddScratchpadItem={handleAddScratchpadItem}
                    onToggleScratchpadItem={handleToggleScratchpadItem}
                    onDeleteScratchpadItem={handleDeleteScratchpadItem}
                    onOpenGlobalDocumentModal={() => openModal(setIsGlobalDocumentModalOpen, 'globalDocumentUpload')}
                    onDeleteGlobalDocument={handleDeleteGlobalDocument}
                    onOpenScratchpad={() => setActiveView('scratchpad')}
                />;
            case 'projects':
                return <ProjectsListView 
                    handleOpenProjectModal={(project) => {
                        setEditingProject(project || { name: '', client: '', address: '', status: 'in_progress' });
                        openModal(setIsProjectModalOpen, 'project');
                    }}
                    projectStatusFilter={projectStatusFilter}
                    setProjectStatusFilter={setProjectStatusFilter}
                    projectSearch={projectSearch}
                    setProjectSearch={setProjectSearch}
                    handleInputFocus={handleInputFocus}
                    filteredProjects={filteredProjects}
                    projects={projects}
                    setActiveProjectId={setActiveProjectId}
                    setActiveView={setActiveView}
                />;
            case 'projectDetail':
                if (!activeProject) {
                    // This should not happen if logic is correct, but as a fallback:
                    setActiveView('projects');
                    return null;
                }
                return <ProjectDetailView 
                    activeProject={activeProject}
                    estimates={estimates}
                    financeEntries={financeEntries}
                    photoReports={photoReports}
                    documents={documents}
                    workStages={workStages}
                    notes={notes}
                    formatCurrency={formatCurrency}
                    statusMap={statusMap}
                    setActiveView={setActiveView}
                    setActiveProjectId={setActiveProjectId}
                    handleOpenProjectModal={(project) => {
                        setEditingProject(project || { name: '', client: '', address: '', status: 'in_progress' });
                        openModal(setIsProjectModalOpen, 'project');
                    }}
                    handleDeleteProject={handleDeleteProject}
                    handleLoadEstimate={handleLoadEstimate}
                    handleAddNewEstimateForProject={handleAddNewEstimateForProject}
                    onOpenFinanceModal={() => openModal(setIsFinanceModalOpen, 'finance')}
                    onDeleteFinanceEntry={handleDeleteFinanceEntry}
                    onOpenPhotoReportModal={() => openModal(setIsPhotoReportModalOpen, 'photoReport')}
                    onViewPhoto={(photo) => openModal(() => setViewingPhoto(photo), 'photoViewer')}
                    onOpenDocumentModal={() => openModal(setIsDocumentModalOpen, 'documentUpload')}
                    onDeleteDocument={handleDeleteDocument}
                    onOpenWorkStageModal={handleOpenWorkStageModal}
                    onDeleteWorkStage={handleDeleteWorkStage}
                    onOpenNoteModal={handleOpenNoteModal}
                    onDeleteNote={handleDeleteNote}
                    onOpenActModal={handleOpenActModal}
                />;
            case 'inventory':
                return <InventoryView
                    inventoryItems={inventoryItems}
                    inventoryNotes={inventoryNotes}
                    projects={projects}
                    onAddItem={handleAddInventoryItem}
                    onUpdateItem={handleUpdateInventoryItem}
                    onDeleteItem={handleDeleteInventoryItem}
                    onAddNote={handleAddInventoryNote}
                    onDeleteNote={handleDeleteInventoryNote}
                    onOpenAddToolModal={() => openModal(setIsAddToolModalOpen, 'addTool')}
                />;
            case 'reports':
                return <ReportsView
                    projects={projects}
                    estimates={estimates}
                    financeEntries={financeEntries}
                />;
            case 'scratchpad':
                return <ScratchpadView
                    content={scratchpad}
                    onSave={handleScratchpadChange}
                    onBack={() => setActiveView('workspace')}
                />;
            case 'estimate':
            default:
                return <EstimateView 
                    currentEstimateProjectId={currentEstimateProjectId}
                    handleBackToProject={handleBackToProject}
                    clientInfo={clientInfo}
                    setClientInfo={setClientInfo}
                    setIsDirty={setIsDirty}
                    handleThemeChange={handleThemeChange}
                    themeIcon={themeIcon}
                    themeMode={themeMode}
                    onOpenLibraryModal={() => openModal(setIsLibraryOpen, 'library')}
                    onOpenEstimatesListModal={() => openModal(setIsEstimatesListOpen, 'estimatesList')}
                    onOpenSettingsModal={() => openModal(setIsSettingsOpen, 'settings')}
                    onOpenAISuggestModal={() => openModal(setIsAISuggestModalOpen, 'aiSuggest')}
                    estimateNumber={estimateNumber}
                    setEstimateNumber={setEstimateNumber}
                    estimateDate={estimateDate}
                    setEstimateDate={setEstimateDate}
                    handleInputFocus={handleInputFocus}
                    items={items}
                    dragItem={dragItem}
                    dragOverItem={dragOverItem}
                    handleDragSort={handleDragSort}
                    draggingItem={draggingItem}
                    setDraggingItem={setDraggingItem}
                    fileInputRefs={fileInputRefs}
                    handleItemImageChange={handleItemImageChange}
                    handleRemoveItemImage={handleRemoveItemImage}
                    handleRemoveItem={handleRemoveItem}
                    handleItemChange={handleItemChange}
                    formatCurrency={formatCurrency}
                    handleAddItem={handleAddItem}
                    discount={discount}
                    setDiscount={setDiscount}
                    discountType={discountType}
                    setDiscountType={setDiscountType}
                    tax={tax}
                    setTax={setTax}
                    calculation={calculation}
                    handleSave={handleSave}
                    isDirty={isDirty}
                    isPdfLoading={isPdfLoading}
                    isSaving={isSaving}
                    handleExportPDF={handleExportPDF}
                    handleShare={handleShare}
                    handleNewEstimate={handleNewEstimate}
                />;
        }
    };

    const isAnyModalOpen = useMemo(() => (
        isSettingsOpen || isEstimatesListOpen || isLibraryOpen || isProjectModalOpen ||
        isFinanceModalOpen || isPhotoReportModalOpen || viewingPhoto !== null ||
        isShoppingListOpen || isDocumentModalOpen || isGlobalDocumentModalOpen ||
        isWorkStageModalOpen || isNoteModalOpen || isActModalOpen || isAISuggestModalOpen ||
        isAddToolModalOpen
    ), [
        isSettingsOpen, isEstimatesListOpen, isLibraryOpen, isProjectModalOpen,
        isFinanceModalOpen, isPhotoReportModalOpen, viewingPhoto,
        isShoppingListOpen, isDocumentModalOpen, isGlobalDocumentModalOpen,
        isWorkStageModalOpen, isNoteModalOpen, isActModalOpen, isAISuggestModalOpen,
        isAddToolModalOpen
    ]);

    return (
        <div className="app-container" aria-hidden={isAnyModalOpen}>
            <header className="app-header">
                <div className="app-header-left">
                    <img src="/logo.png" alt="Логотип" className="app-logo" />
                    <h1>Прораб</h1>
                </div>
                <div className="app-header-right">
                    <button onClick={handleThemeChange} className="header-btn" title={`Тема: ${themeMode}`}>{themeIcon()}</button>
                    <button onClick={() => openModal(setIsLibraryOpen, 'library')} className="header-btn"><IconBook/></button>
                    <button onClick={() => openModal(setIsEstimatesListOpen, 'estimatesList')} className="header-btn"><IconFolder/></button>
                    <button onClick={() => openModal(setIsSettingsOpen, 'settings')} className="header-btn"><IconSettings/></button>
                </div>
            </header>
            {renderView()}
            
            <nav className="bottom-nav">
                <button onClick={() => setActiveView('workspace')} className={activeView === 'workspace' ? 'active' : ''}>
                    <IconHome/>
                    <span>Главная</span>
                </button>
                <button onClick={() => setActiveView('projects')} className={activeView.startsWith('project') ? 'active' : ''}>
                    <IconProject/>
                    <span>Проекты</span>
                </button>
                <button onClick={() => setActiveView('estimate')} className={activeView === 'estimate' ? 'active' : ''}>
                    <IconDocument/>
                    <span>Смета</span>
                </button>
                <button onClick={() => setActiveView('inventory')} className={activeView === 'inventory' ? 'active' : ''}>
                    <IconClipboard/>
                    <span>Инвентарь</span>
                </button>
                <button onClick={() => setActiveView('reports')} className={activeView === 'reports' ? 'active' : ''}>
                    <IconTrendingUp/>
                    <span>Отчеты</span>
                </button>
                
            </nav>

            {isSettingsOpen && <SettingsModal onClose={() => closeModal(setIsSettingsOpen)} profile={companyProfile} onProfileChange={handleProfileChange} onLogoChange={handleLogoChange} onRemoveLogo={removeLogo} onSave={handleSaveProfile} onBackup={handleBackup} onRestore={handleRestore} onInputFocus={handleInputFocus} />}
            {isEstimatesListOpen && <EstimatesListModal onClose={() => closeModal(setIsEstimatesListOpen)} estimates={estimates} templates={templates} activeEstimateId={activeEstimateId} statusMap={statusMap} formatCurrency={formatCurrency} onLoadEstimate={handleLoadEstimate} onDeleteEstimate={handleDeleteEstimate} onStatusChange={handleStatusChange} onSaveAsTemplate={handleSaveAsTemplate} onDeleteTemplate={handleDeleteTemplate} onNewEstimate={handleNewEstimate} onInputFocus={handleInputFocus} />}
            {isLibraryOpen && <LibraryModal onClose={() => closeModal(setIsLibraryOpen)} libraryItems={libraryItems} onLibraryItemsChange={setLibraryItems} onAddItemToEstimate={handleAddFromLibrary} formatCurrency={formatCurrency} onInputFocus={handleInputFocus} showConfirm={safeShowConfirm} showAlert={safeShowAlert} />}
            {isProjectModalOpen && <NewProjectModal project={editingProject} onClose={() => closeModal(setIsProjectModalOpen)} onProjectChange={setEditingProject} onSave={handleSaveProject} onInputFocus={handleInputFocus} />}
            {isFinanceModalOpen && <FinanceEntryModal onClose={() => closeModal(setIsFinanceModalOpen)} onSave={handleSaveFinanceEntry} showAlert={safeShowAlert} onInputFocus={handleInputFocus} />}
            {isPhotoReportModalOpen && <PhotoReportModal onClose={() => closeModal(setIsPhotoReportModalOpen)} onSave={handleSavePhotoReport} showAlert={safeShowAlert} />}
            {viewingPhoto && <PhotoViewerModal photo={viewingPhoto} onClose={() => closeModal(() => setViewingPhoto(null))} onDelete={handleDeletePhoto} />}
            {isShoppingListOpen && <ShoppingListModal items={items} onClose={() => closeModal(setIsShoppingListOpen)} showAlert={safeShowAlert} />}
            {isDocumentModalOpen && <DocumentUploadModal onClose={() => closeModal(setIsDocumentModalOpen)} onSave={handleSaveDocument} showAlert={safeShowAlert} />}
            {isGlobalDocumentModalOpen && <DocumentUploadModal onClose={() => closeModal(setIsGlobalDocumentModalOpen)} onSave={handleSaveGlobalDocument} showAlert={safeShowAlert} />}
            {isWorkStageModalOpen && <WorkStageModal stage={editingWorkStage} onClose={() => closeModal(setIsWorkStageModalOpen)} onSave={handleSaveWorkStage} showAlert={safeShowAlert} />}
            {isNoteModalOpen && <NoteModal note={editingNote} onClose={() => closeModal(setIsNoteModalOpen)} onSave={handleSaveNote} showAlert={safeShowAlert} />}
            {isActModalOpen && activeProject && <ActGenerationModal onClose={() => closeModal(setIsActModalOpen)} project={activeProject} profile={companyProfile} totalAmount={actModalTotal} showAlert={safeShowAlert} />}
            {isAISuggestModalOpen && <AISuggestModal onClose={() => closeModal(setIsAISuggestModalOpen)} onAddItems={handleAddItemsFromAI} showAlert={safeShowAlert} />}
            {isAddToolModalOpen && <AddToolModal onClose={() => closeModal(setIsAddToolModalOpen)} onSave={handleAddInventoryItem} />}
            {isTaskDetailModalOpen && <TaskDetailModal 
                task={editingTask} 
                projects={projects}
                onClose={() => closeModal(setIsTaskDetailModalOpen)} 
                onSave={handleSaveTaskDetail} 
                onDelete={handleDeleteTaskDetail} 
                showAlert={safeShowAlert}
                onInputFocus={handleInputFocus}
            />}
        </div>
    );
}

export default App;
