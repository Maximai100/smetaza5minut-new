import React, { useState, useMemo } from 'react';
import { WorkspaceViewProps, TaskFilter, Task } from '../../types';
import { IconPlus, IconTrash, IconDocument, IconDownload, IconExternalLink, IconClose, IconEdit, IconCalendar } from '../common/Icon';

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
    tasks,
    scratchpad,
    globalDocuments,
    projects,
    taskFilter,
    setTaskFilter,
    onAddTask,
    onToggleTask,
    onDeleteTask,
    onPostponeTask,
    onOpenTaskDetailModal,
    onScratchpadChange,
    onOpenGlobalDocumentModal,
    onDeleteGlobalDocument,
    onOpenScratchpad,
}) => {
    const [newTaskText, setNewTaskText] = useState('');
    const [openPostponeMenu, setOpenPostponeMenu] = useState<number | null>(null);

    const handleAddTask = () => {
        if (newTaskText.trim()) {
            onAddTask(newTaskText.trim());
            setNewTaskText('');
        }
    };

    const groupedTasks = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

        const filteredTasks = tasks.filter(task => {
            if (taskFilter === 'completed') {
                return task.completed;
            }
            if (task.completed) {
                return false; // Hide completed tasks from non-completed filters
            }
            if (taskFilter === 'all') {
                return true;
            }

            const dueDate = task.dueDate ? new Date(task.dueDate) : null;
            if (!dueDate) return taskFilter === 'all'; // Show tasks without due date only in 'all' filter
            dueDate.setHours(0, 0, 0, 0);

            if (taskFilter === 'today') {
                return dueDate.getTime() === today.getTime();
            }
            if (taskFilter === 'week') {
                return dueDate.getTime() >= today.getTime() && dueDate.getTime() <= endOfWeek.getTime();
            }
            if (taskFilter === 'overdue') {
                return dueDate.getTime() < today.getTime();
            }

            return true; // Should not be reached if filter is one of the above
        });

        if (taskFilter === 'completed') {
            return { 'Выполненные': filteredTasks };
        }

        const groups: { [key: string]: Task[] } = {
            'Просроченные': [],
            'Сегодня': [],
            'Завтра': [],
            'На этой неделе': [],
            'Предстоящие': [],
            'Без срока': [],
        };

        filteredTasks.forEach(task => {
            if (!task.dueDate) {
                groups['Без срока'].push(task);
                return;
            }

            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate.getTime() < today.getTime()) {
                groups['Просроченные'].push(task);
            } else if (dueDate.getTime() === today.getTime()) {
                groups['Сегодня'].push(task);
            } else if (dueDate.getTime() === tomorrow.getTime()) {
                groups['Завтра'].push(task);
            } else if (dueDate.getTime() <= endOfWeek.getTime()) {
                groups['На этой неделе'].push(task);
            } else {
                groups['Предстоящие'].push(task);
            }
        });

        return groups;
    }, [tasks, taskFilter]);

    return (
        <>
            <header className="workspace-header">
                <h1>Рабочий стол</h1>
            </header>
            <main className="workspace-container">
                {/* Tasks */}
                <div className="card">
                    <div className="card-header">
                        <h2>Мои задачи</h2>
                        <div className="task-filters">
                            <button onClick={() => setTaskFilter('all')} className={taskFilter === 'all' ? 'active' : ''}>Все</button>
                            <button onClick={() => setTaskFilter('today')} className={taskFilter === 'today' ? 'active' : ''}>Сегодня</button>
                            <button onClick={() => setTaskFilter('week')} className={taskFilter === 'week' ? 'active' : ''}>Неделя</button>
                            <button onClick={() => setTaskFilter('overdue')} className={taskFilter === 'overdue' ? 'active' : ''}>Просроченные</button>
                            <button onClick={() => setTaskFilter('completed')} className={taskFilter === 'completed' ? 'active' : ''}>Выполненные</button>
                        </div>
                    </div>
                    <div className="task-input-container">
                        <textarea 
                            value={newTaskText} 
                            onChange={(e) => setNewTaskText(e.target.value)} 
                            placeholder="Добавить новую задачу..." 
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddTask();
                                }
                            }}
                            rows={1}
                            style={{ overflowY: 'hidden', resize: 'none', minHeight: '24px' }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement;
                                target.style.height = 'auto';
                                target.style.height = `${target.scrollHeight}px`;
                            }}
                        />
                        <button onClick={handleAddTask} className="add-task-btn"><IconPlus/></button>
                    </div>
                    <div className="task-list">
                        {Object.values(groupedTasks).every(arr => arr.length === 0) ? (
                            <p className="empty-list-message">{taskFilter === 'all' ? 'У вас пока нет задач. Добавьте свою первую задачу выше!' : 'Задач по выбранному фильтру не найдено.'}</p>
                        ) : (
                            Object.entries(groupedTasks).map(([group, tasks]) => (
                                tasks.length > 0 && (
                                    <div key={group} className="task-group">
                                        <h3>{group}</h3>
                                        <ul>
                                            {tasks.map(task => {
                                                const project = task.projectId ? projects.find(p => p.id === task.projectId) : null;
                                                const priorityClass = `priority-${task.priority || 'medium'}`;

                                                return (
                                                    <li key={task.id}>
                                                        <span>{task.text}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )
                            ))
                        )}
                    </div>
                </div>

                {/* Scratchpad */}
                <div className="card scratchpad-card">
                    <div className="card-header">
                        <h2>Блокнот</h2>
                        <button onClick={onOpenScratchpad} className="expand-btn" aria-label="Развернуть блокнот">
                            <IconExternalLink />
                        </button>
                    </div>
                    <div className="scratchpad-content">
                        <textarea 
                            value={scratchpad} 
                            onChange={(e) => onScratchpadChange(e.target.value)} 
                            placeholder="Место для быстрых заметок..."
                            className="scratchpad-textarea"
                            rows={4}
                        />
                    </div>
                </div>

                {/* My Documents */}
                <div className="card">
                    <div className="card-header">
                        <h2>Мои файлы</h2>
                        <button onClick={onOpenGlobalDocumentModal} className="btn btn-secondary add-document-btn">+ Добавить</button>
                    </div>
                    <ul className="document-list">
                        {globalDocuments.map(doc => (
                            <li key={doc.id} className="document-list-item">
                                <IconDocument />
                                <div className="doc-info">
                                    <span>{doc.name}</span>
                                    <small>{new Date(doc.date).toLocaleDateString('ru-RU')}</small>
                                </div>
                                <div className="doc-actions">
                                    <a href={doc.dataUrl} download={doc.name} className="btn-icon" aria-label="Скачать" rel="noopener noreferrer"><IconDownload /></a>
                                    <button onClick={() => onDeleteGlobalDocument(doc.id)} className="btn-icon" aria-label="Удалить"><IconTrash /></button>
                                </div>
                            </li>
                        ))}
                        {globalDocuments.length === 0 && (
                            <div className="empty-list-message-with-button">
                                <p className="empty-list-message">У вас пока нет документов. Загрузите важные файлы, чтобы они всегда были под рукой!</p>
                                <button onClick={onOpenGlobalDocumentModal} className="btn btn-primary">+ Загрузить документ</button>
                            </div>
                        )}
                    </ul>
                </div>
            </main>
        </>
    );
};