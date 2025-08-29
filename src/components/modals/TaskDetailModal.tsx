import React, { useState, useRef, useEffect } from 'react';
import { Task, Project, Subtask, Attachment, TaskDetailModalProps } from '../../types';
import { IconClose, IconTrash, IconPlus } from '../common/Icon';
import { safeShowAlert } from '../../utils';

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, projects, onClose, onSave, onDelete, showAlert, onInputFocus }) => {
    const [currentTask, setCurrentTask] = useState<Task>(task || {
        id: Date.now(),
        text: '',
        completed: false,
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'medium',
        subtasks: [],
        attachments: [],
        tags: [],
    });
    const [newSubtaskText, setNewSubtaskText] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            if (firstElement) {
                firstElement.focus();
            }
        }
    }, []);

    const handleTaskChange = (field: keyof Task, value: any) => {
        setCurrentTask(prev => ({ ...prev, [field]: value }));
    };

    const handleAddSubtask = () => {
        if (newSubtaskText.trim()) {
            const newSubtask: Subtask = {
                id: Date.now(),
                text: newSubtaskText.trim(),
                completed: false,
            };
            setCurrentTask(prev => ({
                ...prev,
                subtasks: [...(prev.subtasks || []), newSubtask],
            }));
            setNewSubtaskText('');
        }
    };

    const handleToggleSubtask = (id: number) => {
        setCurrentTask(prev => ({
            ...prev,
            subtasks: (prev.subtasks || []).map(sub =>
                sub.id === id ? { ...sub, completed: !sub.completed } : sub
            ),
        }));
    };

    const handleDeleteSubtask = (id: number) => {
        setCurrentTask(prev => ({
            ...prev,
            subtasks: (prev.subtasks || []).filter(sub => sub.id !== id),
        }));
    };

    const handleSave = () => {
        if (!currentTask.text.trim()) {
            showAlert('Название задачи не может быть пустым.');
            return;
        }
        onSave(currentTask);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" ref={modalRef}>
                <div className="modal-header">
                    <h2>{task ? 'Редактировать задачу' : 'Новая задача'}</h2>
                    <button onClick={onClose} className="close-btn" aria-label="Закрыть"><IconClose /></button>
                </div>
                <div className="modal-body task-detail-modal-body">
                    <label>Название задачи</label>
                    <input
                        type="text"
                        value={currentTask.text}
                        onChange={(e) => handleTaskChange('text', e.target.value)}
                        onFocus={onInputFocus}
                        placeholder="Название задачи"
                    />

                    <label>Описание</label>
                    <textarea
                        value={currentTask.description || ''}
                        onChange={(e) => handleTaskChange('description', e.target.value)}
                        onFocus={onInputFocus}
                        placeholder="Подробное описание задачи..."
                        rows={3}
                    />

                    <label>Проект</label>
                    <select
                        value={currentTask.projectId || ''}
                        onChange={(e) => handleTaskChange('projectId', e.target.value ? parseInt(e.target.value) : undefined)}
                        onFocus={onInputFocus}
                    >
                        <option value="">Без проекта</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <label>Исполнитель</label>
                    <input
                        type="text"
                        value={currentTask.executor || ''}
                        onChange={(e) => handleTaskChange('executor', e.target.value)}
                        onFocus={onInputFocus}
                        placeholder="Имя исполнителя"
                    />

                    <label>Срок выполнения</label>
                    <input
                        type="date"
                        value={currentTask.dueDate || ''}
                        onChange={(e) => handleTaskChange('dueDate', e.target.value)}
                        onFocus={onInputFocus}
                    />

                    <label>Приоритет</label>
                    <select
                        value={currentTask.priority || 'medium'}
                        onChange={(e) => handleTaskChange('priority', e.target.value as 'low' | 'medium' | 'high')}
                        onFocus={onInputFocus}
                    >
                        <option value="low">Низкий</option>
                        <option value="medium">Средний</option>
                        <option value="high">Высокий</option>
                    </select>

                    {/* Subtasks Checklist */}
                    <div className="subtasks-section">
                        <h3>Чек-лист подзадач</h3>
                        <div className="subtask-input-container">
                            <input
                                type="text"
                                value={newSubtaskText}
                                onChange={(e) => setNewSubtaskText(e.target.value)}
                                onKeyPress={(e) => { if (e.key === 'Enter') handleAddSubtask(); }} 
                                onFocus={onInputFocus}
                                placeholder="Добавить подзадачу..."
                            />
                            <button onClick={handleAddSubtask} className="btn btn-secondary"><IconPlus /></button>
                        </div>
                        <ul className="subtask-list">
                            {(currentTask.subtasks || []).map(sub => (
                                <li key={sub.id} className={sub.completed ? 'completed' : ''}>
                                    <input
                                        type="checkbox"
                                        checked={sub.completed}
                                        onChange={() => handleToggleSubtask(sub.id)}
                                    />
                                    <span onClick={() => handleToggleSubtask(sub.id)}>{sub.text}</span>
                                    <button onClick={() => handleDeleteSubtask(sub.id)}><IconClose /></button>
                                </li>
                            ))}
                            {(currentTask.subtasks || []).length === 0 && <p className="empty-list-message">Подзадач пока нет.</p>}
                        </ul>
                    </div>

                    {/* Attachments */}
                    <div className="attachments-section">
                        <h3>Прикрепленные файлы</h3>
                        <input
                            type="file"
                            onChange={async (e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        if (event.target && typeof event.target.result === 'string') {
                                            const newAttachment: Attachment = {
                                                id: Date.now(),
                                                name: file.name,
                                                dataUrl: event.target.result,
                                                type: file.type,
                                            };
                                            handleTaskChange('attachments', [...(currentTask.attachments || []), newAttachment]);
                                        }
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                        <ul className="attachment-list">
                            {(currentTask.attachments || []).map(att => (
                                <li key={att.id}>
                                    <span>{att.name}</span>
                                    <button onClick={() => handleTaskChange('attachments', (currentTask.attachments || []).filter(a => a.id !== att.id))}><IconClose /></button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Tags */}
                    <div className="tags-section">
                        <h3>Метки/Теги</h3>
                        <input
                            type="text"
                            value={(currentTask.tags || []).join(', ')}
                            onChange={(e) => handleTaskChange('tags', e.target.value.split(',').map(t => t.trim()))}
                            onFocus={onInputFocus}
                            placeholder="#электрика, #сантехника, #закупка"
                        />
                    </div>

                    {/* Comments */}
                    <div className="comments-section">
                        <h3>Комментарии</h3>
                        <textarea
                            value={currentTask.comments || ''}
                            onChange={(e) => handleTaskChange('comments', e.target.value)}
                            onFocus={onInputFocus}
                            placeholder="Добавить комментарий..."
                            rows={3}
                        />
                    </div>

                </div>
                <div className="modal-footer">
                    {task && <button onClick={() => onDelete(task.id)} className="btn btn-tertiary">Удалить задачу</button>}
                    <button onClick={handleSave} className="btn btn-primary">Сохранить</button>
                </div>
            </div>
        </div>
    );
};