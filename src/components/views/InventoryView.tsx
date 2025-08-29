import React, { useState } from 'react';
import { InventoryViewProps, InventoryItem, Project, ConsumableItem } from '../../types';
import { IconPlus, IconTrash } from '../common/Icon';

export const InventoryView: React.FC<InventoryViewProps> = ({
    inventoryItems,
    inventoryNotes,
    projects,
    consumables,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
    onAddNote,
    onDeleteNote,
    onOpenAddToolModal,
    onOpenToolDetail,
    onAddConsumable,
    onUpdateConsumable,
    onDeleteConsumable,
}) => {
    const [newNote, setNewNote] = useState('');
    const [activeTab, setActiveTab] = useState<'tools' | 'consumables'>('tools');
    const [newConsumableName, setNewConsumableName] = useState('');
    const [newConsumableQuantity, setNewConsumableQuantity] = useState(1);

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        onAddNote({ text: newNote });
        setNewNote('');
    };

    const handleAddConsumableItem = () => {
        if (!newConsumableName.trim() || newConsumableQuantity <= 0) {
            // showAlert('Введите наименование и количество.');
            return;
        }
        onAddConsumable({ name: newConsumableName.trim(), quantity: newConsumableQuantity });
        setNewConsumableName('');
        setNewConsumableQuantity(1);
    };

    return (
        <>
            <header className="projects-list-header">
                <h1>Инвентарь</h1>
                <div className="header-actions">
                    {activeTab === 'tools' && (
                        <button onClick={onOpenAddToolModal} className="header-btn" aria-label="Новый инструмент"><IconPlus /></button>
                    )}
                    {activeTab === 'consumables' && (
                        <button onClick={handleAddConsumableItem} className="header-btn" aria-label="Новый расходник"><IconPlus /></button>
                    )}
                </div>
            </header>
            <main>
                <div className="modal-tabs">
                    <button onClick={() => setActiveTab('tools')} className={activeTab === 'tools' ? 'active' : ''}>Инструменты</button>
                    <button onClick={() => setActiveTab('consumables')} className={activeTab === 'consumables' ? 'active' : ''}>Расходники</button>
                </div>

                {activeTab === 'tools' && (
                    <div className="card project-section">
                        <div className="project-section-header">
                            <h3>Список инструментов ({inventoryItems.length})</h3>
                        </div>
                        <div className="project-section-body">
                            <div className="project-items-list inventory-list">
                                {inventoryItems.length > 0 ? inventoryItems.map(item => (
                                    <div key={item.id} className="list-item" onClick={() => onOpenToolDetail(item)} style={{ minHeight: 'auto', padding: '8px 12px', height: 'auto', display: 'flex', alignItems: 'flex-start' }}>
                                        <div className="list-item-info" style={{ minHeight: 'auto', gap: '2px', height: 'auto', flex: 1 }}>
                                            <strong style={{ lineHeight: '1.2', minHeight: 'auto', height: 'auto', margin: 0, padding: 0, display: 'block' }}>{item.name}</strong>
                                        </div>
                                        <div className="list-item-actions" style={{ flexDirection: 'column', gap: '4px', alignItems: 'flex-end', height: 'auto', minHeight: 'auto', display: 'flex' }}>
                                            <select value={item.location} onChange={(e) => onUpdateItem({ ...item, location: e.target.value })} onClick={e => e.stopPropagation()} style={{ fontSize: '12px', padding: '4px 6px', minWidth: '80px', height: 'auto' }}>
                                                <option value="На базе">На базе</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                            <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} className="btn btn-tertiary" aria-label="Удалить" style={{ padding: '6px', minWidth: '32px', minHeight: '32px', height: '32px' }}><IconTrash /></button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-list-message-with-button">
                                        <p className="no-results-message">Инструментов пока нет. Добавьте свой первый инструмент, чтобы начать отслеживать его местоположение.</p>
                                        <button onClick={onOpenAddToolModal} className="btn btn-primary">+ Добавить инструмент</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'consumables' && (
                    <div className="card project-section">
                        <div className="project-section-header">
                            <h3>Список расходников ({consumables.length})</h3>
                        </div>
                        <div className="project-section-body">
                            <div className="project-items-list inventory-list">
                                {consumables.length > 0 ? consumables.map(item => (
                                    <div key={item.id} className="list-item" style={{ minHeight: 'auto', padding: '8px 12px', height: 'auto', display: 'flex', alignItems: 'flex-start' }}>
                                        <div className="list-item-info" style={{ minHeight: 'auto', gap: '2px', height: 'auto', flex: 1 }}>
                                            <strong style={{ lineHeight: '1.2', minHeight: 'auto', height: 'auto', margin: 0, padding: 0, display: 'block' }}>{item.name}</strong>
                                            <span style={{ fontSize: '12px', color: 'var(--hint-color)' }}>Количество: {item.quantity}</span>
                                        </div>
                                        <div className="list-item-actions" style={{ flexDirection: 'column', gap: '4px', alignItems: 'flex-end', height: 'auto', minHeight: 'auto', display: 'flex' }}>
                                            <button onClick={() => onUpdateConsumable({ ...item, quantity: item.quantity + 1 })} className="btn btn-secondary" style={{ padding: '6px', minWidth: '32px', minHeight: '32px', height: '32px' }}>+</button>
                                            <button onClick={() => onUpdateConsumable({ ...item, quantity: Math.max(0, item.quantity - 1) })} className="btn btn-secondary" style={{ padding: '6px', minWidth: '32px', minHeight: '32px', height: '32px' }}>-</button>
                                            <button onClick={() => onDeleteConsumable(item.id)} className="btn btn-tertiary" style={{ padding: '6px', minWidth: '32px', minHeight: '32px', height: '32px' }}><IconTrash /></button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-list-message-with-button">
                                        <p className="no-results-message">Расходников пока нет. Добавьте свой первый расходник.</p>
                                        <button onClick={handleAddConsumableItem} className="btn btn-primary">+ Добавить расходник</button>
                                    </div>
                                )}
                            </div>
                            <div className="add-consumable-form">
                                <input 
                                    type="text" 
                                    value={newConsumableName}
                                    onChange={e => setNewConsumableName(e.target.value)}
                                    placeholder="Наименование расходника"
                                />
                                <input 
                                    type="number" 
                                    value={newConsumableQuantity}
                                    onChange={e => setNewConsumableQuantity(Number(e.target.value))}
                                    min="1"
                                />
                                <button onClick={handleAddConsumableItem} className="btn btn-primary">Добавить</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="card project-section">
                    <div className="project-section-header">
                        <h3>Заметки по инвентарю</h3>
                    </div>
                    <div className="project-section-body">
                        <div className="note-list">
                            {inventoryNotes.length > 0 ? inventoryNotes.map(note => (
                                <div key={note.id} className="list-item note-item">
                                    <div className="list-item-info">
                                        <p className="note-content">{note.text}</p>
                                        <span className="note-date">{new Date(note.date).toLocaleDateString('ru-RU')}</span>
                                    </div>
                                    <div className="list-item-actions">
                                        <button onClick={() => onDeleteNote(note.id)} className="btn btn-tertiary" aria-label="Удалить"><IconTrash /></button>
                                    </div>
                                </div>
                            )) : (
                                <p className="no-results-message">Заметок по инвентарю пока нет. Добавьте заметку, чтобы не забыть важную информацию.</p>
                            )}
                        </div>
                        <div className="add-note-form">
                            <textarea 
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Новая заметка..."
                                rows={3}
                                style={{ minHeight: '60px', maxHeight: '120px', height: '60px', padding: '8px', fontSize: '14px', lineHeight: '1.3' }}
                            />
                            <button onClick={handleAddNote} className="btn btn-primary">Добавить заметку</button>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
};