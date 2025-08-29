import React, { useState } from 'react';
import { FilterModalProps } from '../../types';
import { IconClose } from '../common/Icon';

export const FilterModal: React.FC<FilterModalProps> = ({ 
    onClose, 
    onApply, 
    initialFilters, 
    projects 
}) => {
    const [filters, setFilters] = useState(initialFilters);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleReset = () => {
        const resetFilters = { project: null, executor: '', tags: '' };
        setFilters(resetFilters);
        onApply(resetFilters);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Фильтр задач</h2>
                    <button onClick={onClose} className="close-btn" aria-label="Закрыть"><IconClose /></button>
                </div>
                <div className="modal-body">
                    <label>Проект</label>
                    <select 
                        value={filters.project || ''} 
                        onChange={e => setFilters(f => ({ ...f, project: e.target.value ? Number(e.target.value) : null }))}
                    >
                        <option value="">Все проекты</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <label>Исполнитель</label>
                    <input 
                        type="text" 
                        value={filters.executor}
                        onChange={e => setFilters(f => ({ ...f, executor: e.target.value }))}
                        placeholder="Имя исполнителя"
                    />

                    <label>Метки (через запятую)</label>
                    <input 
                        type="text" 
                        value={filters.tags}
                        onChange={e => setFilters(f => ({ ...f, tags: e.target.value }))}
                        placeholder="#электрика, #закупка"
                    />
                </div>
                <div className="modal-footer">
                    <button onClick={handleApply} className="btn btn-primary">Применить</button>
                    <button onClick={handleReset} className="btn btn-secondary">Сбросить фильтры</button>
                </div>
            </div>
        </div>
    );
};