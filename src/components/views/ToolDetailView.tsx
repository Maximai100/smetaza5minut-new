import React, { useState, useEffect } from 'react';
import { InventoryItem, Project, ToolCondition, ToolMovement } from '../../types';
import { IconChevronRight, IconCamera, IconTrash, IconPlus } from '../common/Icon';
import { resizeImage } from '../../utils';

interface ToolDetailViewProps {
    tool: InventoryItem;
    projects: Project[];
    onClose: () => void;
    onSave: (tool: InventoryItem) => void;
    onDelete: (id: number) => void;
    showAlert: (message: string) => void;
}

export const ToolDetailView: React.FC<ToolDetailViewProps> = ({
    tool, projects, onClose, onSave, onDelete, showAlert
}) => {
    const [currentTool, setCurrentTool] = useState<InventoryItem>(tool);
    const [newMovementDate, setNewMovementDate] = useState(new Date().toISOString().split('T')[0]);
    const [newMovementFrom, setNewMovementFrom] = useState('');
    const [newMovementTo, setNewMovementTo] = useState('');
    const [newMovementNotes, setNewMovementNotes] = useState('');

    useEffect(() => {
        setCurrentTool(tool);
    }, [tool]);

    const handleFieldChange = (field: keyof InventoryItem, value: any) => {
        setCurrentTool(prev => ({ ...prev, [field]: value }));
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const resized = await resizeImage(file, 800);
            handleFieldChange('photo', resized);
        } catch (error) {
            showAlert('Не удалось обработать фото.');
        }
    };

    const handleAddMovement = () => {
        if (!newMovementFrom.trim() || !newMovementTo.trim()) {
            showAlert('Укажите откуда и куда перемещен инструмент.');
            return;
        }
        const newMovement: ToolMovement = {
            date: newMovementDate,
            from: newMovementFrom.trim(),
            to: newMovementTo.trim(),
            notes: newMovementNotes.trim() || undefined,
        };
        setCurrentTool(prev => ({
            ...prev,
            movementHistory: [...(prev.movementHistory || []), newMovement],
        }));
        setNewMovementFrom('');
        setNewMovementTo('');
        setNewMovementNotes('');
        setNewMovementDate(new Date().toISOString().split('T')[0]);
    };

    const handleDeleteMovement = (index: number) => {
        setCurrentTool(prev => ({
            ...prev,
            movementHistory: (prev.movementHistory || []).filter((_, i) => i !== index),
        }));
    };

    const handleSave = () => {
        if (!currentTool.name.trim()) {
            showAlert('Название инструмента не может быть пустым.');
            return;
        }
        onSave(currentTool);
    };

    const handleDelete = () => {
        onDelete(currentTool.id);
    };

    const toolConditions: ToolCondition[] = ['Отличное', 'Требует обслуживания', 'В ремонте'];

    return (
        <div className="tool-detail-view">
            <header className="tool-detail-header">
                <button onClick={onClose} className="back-btn"><IconChevronRight style={{transform: 'rotate(180deg)'}} /></button>
                <h1>{currentTool.name || 'Новый инструмент'}</h1>
                <div className="header-actions">
                    <button onClick={handleDelete} className="header-btn" aria-label="Удалить инструмент"><IconTrash /></button>
                </div>
            </header>
            <main className="tool-detail-main">
                <div className="card">
                    <label>Название инструмента</label>
                    <input 
                        type="text" 
                        value={currentTool.name} 
                        onChange={e => handleFieldChange('name', e.target.value)}
                        placeholder="Например, Перфоратор Bosch"
                    />

                    <label>Местоположение</label>
                    <select 
                        value={currentTool.location} 
                        onChange={e => handleFieldChange('location', e.target.value)}
                    >
                        <option value="На базе">На базе</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <label>Фотография</label>
                    {currentTool.photo ? (
                        <div className="image-preview-container large-preview">
                            <img src={currentTool.photo} alt="Фото инструмента" className="image-preview" />
                            <button onClick={() => handleFieldChange('photo', null)} className="remove-image-btn"><IconClose /></button>
                        </div>
                    ) : (
                        <input type="file" accept="image/*" onChange={handlePhotoChange} />
                    )}

                    <label>Серийный номер</label>
                    <input 
                        type="text" 
                        value={currentTool.serialNumber || ''} 
                        onChange={e => handleFieldChange('serialNumber', e.target.value)}
                        placeholder="Серийный номер"
                    />

                    <label>Дата покупки</label>
                    <input 
                        type="date" 
                        value={currentTool.purchaseDate || ''} 
                        onChange={e => handleFieldChange('purchaseDate', e.target.value)}
                    />

                    <label>Цена покупки</label>
                    <input 
                        type="number" 
                        value={currentTool.price || ''} 
                        onChange={e => handleFieldChange('price', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                    />

                    <label>Состояние</label>
                    <select 
                        value={currentTool.condition || 'Отличное'} 
                        onChange={e => handleFieldChange('condition', e.target.value as ToolCondition)}
                    >
                        {toolConditions.map(condition => (
                            <option key={condition} value={condition}>{condition}</option>
                        ))}
                    </select>
                </div>

                <div className="card">
                    <h3>История перемещений</h3>
                    <div className="movement-history-list">
                        {(currentTool.movementHistory || []).length > 0 ? (
                            (currentTool.movementHistory || []).map((move, index) => (
                                <div key={index} className="list-item movement-item">
                                    <div className="list-item-info">
                                        <strong>{move.from} &rarr; {move.to}</strong>
                                        <span>{new Date(move.date).toLocaleDateString('ru-RU')}</span>
                                        {move.notes && <small>{move.notes}</small>}
                                    </div>
                                    <button onClick={() => handleDeleteMovement(index)} className="btn btn-tertiary"><IconTrash /></button>
                                </div>
                            ))
                        ) : (
                            <p className="empty-list-message">История перемещений пуста.</p>
                        )}
                    </div>
                    <div className="add-movement-form">
                        <label>Дата</label>
                        <input type="date" value={newMovementDate} onChange={e => setNewMovementDate(e.target.value)} />
                        <label>Откуда</label>
                        <input type="text" value={newMovementFrom} onChange={e => setNewMovementFrom(e.target.value)} placeholder="Например, Склад" />
                        <label>Куда</label>
                        <input type="text" value={newMovementTo} onChange={e => setNewMovementTo(e.target.value)} placeholder="Например, Объект на Ленина, 45" />
                        <label>Заметки (необязательно)</label>
                        <textarea value={newMovementNotes} onChange={e => setNewMovementNotes(e.target.value)} placeholder="Дополнительные детали" rows={2} />
                        <button onClick={handleAddMovement} className="btn btn-primary"><IconPlus /> Добавить перемещение</button>
                    </div>
                </div>
            </main>
            <div className="modal-footer">
                <button onClick={handleSave} className="btn btn-primary">Сохранить изменения</button>
            </div>
        </div>
    );
};