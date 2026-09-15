import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Image as ImageIcon, 
  Upload, 
  Eye, 
  X, 
  Check, 
  Sparkles, 
  Clock, 
  Tag, 
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { PortfolioItem, Service } from '../types.ts';

interface AdminPortfolioTabProps {
  portfolioWorks: PortfolioItem[];
  services: Service[];
  onDataChanged: () => void;
}

export const AdminPortfolioTab: React.FC<AdminPortfolioTabProps> = ({
  portfolioWorks,
  services,
  onDataChanged,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [previewZoomItem, setPreviewZoomItem] = useState<PortfolioItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'lashes' | 'lamination' | 'brows' | 'effects'>('lashes');
  const [formDescription, setFormDescription] = useState('');
  const [formCurl, setFormCurl] = useState('Изгиб C / D');
  const [formLength, setFormLength] = useState('8–12 мм');
  const [formVolume, setFormVolume] = useState('2D объем');
  const [formDuration, setFormDuration] = useState('1 ч 45 мин');
  const [formServiceId, setFormServiceId] = useState(services[0]?.id || '');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formTags, setFormTags] = useState('Натуральный взгляд, Изгиб C, Легкость');

  const categories = [
    { id: 'all', label: 'Все работы' },
    { id: 'lashes', label: 'Наращивание' },
    { id: 'lamination', label: 'Ламинирование' },
    { id: 'brows', label: 'Брови' },
    { id: 'effects', label: 'Трендовые эффекты' },
  ];

  const filteredWorks = portfolioWorks.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const resetForm = () => {
    setFormTitle('');
    setFormCategory('lashes');
    setFormDescription('');
    setFormCurl('Изгиб C / D');
    setFormLength('8–12 мм');
    setFormVolume('2D объем');
    setFormDuration('1 ч 45 мин');
    setFormServiceId(services[0]?.id || '');
    setFormImageUrl('');
    setFormTags('Лисий эффект, Невесомо, Носка 5-6 недель');
    setEditingItem(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormDescription(item.description);
    setFormCurl(item.curl || '');
    setFormLength(item.length || '');
    setFormVolume(item.volume || '');
    setFormDuration(item.duration || '');
    setFormServiceId(item.serviceId || '');
    setFormImageUrl(item.imageUrl);
    setFormTags(item.tags ? item.tags.join(', ') : '');
    setIsAddModalOpen(true);
  };

  // Handle local file upload (converts to base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Пожалуйста, выберите изображение размером до 5 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formImageUrl.trim()) {
      alert('Пожалуйста, укажите название работы и загрузите изображение');
      return;
    }

    setIsSubmitting(true);
    const categoryLabel = categories.find(c => c.id === formCategory)?.label || 'Наращивание';
    const tagsArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const payload = {
      title: formTitle.trim(),
      category: formCategory,
      categoryLabel,
      description: formDescription.trim(),
      curl: formCurl.trim(),
      length: formLength.trim(),
      volume: formVolume.trim(),
      duration: formDuration.trim(),
      serviceId: formServiceId,
      imageUrl: formImageUrl.trim(),
      tags: tagsArray,
    };

    try {
      if (editingItem) {
        // Update
        const res = await fetch(`/api/portfolio/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setAlertMessage('Работа успешно обновлена! ✨');
        }
      } else {
        // Create new
        const res = await fetch('/api/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setAlertMessage('Новая работа добавлена в портфолио! 📸');
        }
      }

      setIsAddModalOpen(false);
      resetForm();
      onDataChanged();
      setTimeout(() => setAlertMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save portfolio work:', err);
      alert('Ошибка при сохранении работы');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Удалить работу «${title}» из портфолио?`)) return;

    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAlertMessage('Работа удалена из портфолио');
        onDataChanged();
        setTimeout(() => setAlertMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to delete portfolio item:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Alert banner */}
      {alertMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="cursor-pointer text-emerald-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl text-[#232120] font-medium">Управление портфолио</h2>
            <span className="text-xs bg-[#FAF0E6] text-[#8C6D3F] border border-[#E8D6C0] px-2 py-0.5 rounded-full font-medium">
              {portfolioWorks.length} фото
            </span>
          </div>
          <p className="text-xs text-[#6E6259] mt-0.5">
            Загружайте новые фотоработы студии Lashm.anya, настраивайте параметры изгиба, длины и объема
          </p>
        </div>

        <button
          id="btn-add-portfolio-item"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#483F38] hover:bg-[#232120] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Добавить работу</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex overflow-x-auto gap-1.5 w-full sm:w-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-[#483F38] text-white'
                  : 'bg-white border border-[#E5E0D8] text-[#6E6259] hover:bg-[#FAF8F5]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Поиск по названию или тегам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120] placeholder-[#A0958C] focus:outline-none focus:border-[#483F38]"
          />
        </div>
      </div>

      {/* Portfolio Grid */}
      {filteredWorks.length === 0 ? (
        <div className="text-center py-16 bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-3">
          <ImageIcon className="w-10 h-10 mx-auto text-[#DFCFC0]" />
          <p className="font-serif text-lg font-medium text-[#232120]">Работы не найдены</p>
          <p className="text-xs text-[#6E6259]">
            Попробуйте изменить категорию поиска или загрузите новое фото работы
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-2 text-xs bg-[#483F38] text-white px-4 py-2 rounded-xl font-medium cursor-pointer"
          >
            + Добавить первую работу
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorks.map((work) => (
            <div
              key={work.id}
              className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col group"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[4/3] bg-[#FAF8F5] overflow-hidden">
                <img
                  src={work.imageUrl}
                  alt={work.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium tracking-wide">
                    {work.categoryLabel || work.category}
                  </span>
                </div>

                {/* Quick overlay buttons */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setPreviewZoomItem(work)}
                    className="p-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#232120] hover:bg-white shadow-xs cursor-pointer"
                    title="Предпросмотр"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(work)}
                    className="p-1.5 rounded-full bg-white/90 backdrop-blur-md text-[#232120] hover:bg-white shadow-xs cursor-pointer"
                    title="Редактировать"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(work.id, work.title)}
                    className="p-1.5 rounded-full bg-white/90 backdrop-blur-md text-red-600 hover:bg-red-50 shadow-xs cursor-pointer"
                    title="Удалить"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Work Details Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <h3 className="font-serif text-base font-semibold text-[#232120] leading-snug">
                    {work.title}
                  </h3>
                  <p className="text-xs text-[#6E6259] line-clamp-2 leading-relaxed">
                    {work.description}
                  </p>
                </div>

                {/* Specs: Curl, Length, Volume */}
                <div className="grid grid-cols-3 gap-1 pt-2 border-t border-[#F5F0EA] text-[10px] text-center">
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5]">
                    <span className="text-[#8C827A] block">Изгиб</span>
                    <span className="font-semibold text-[#232120] truncate block">{work.curl || '—'}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5]">
                    <span className="text-[#8C827A] block">Длина</span>
                    <span className="font-semibold text-[#232120] truncate block">{work.length || '—'}</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#FAF8F5]">
                    <span className="text-[#8C827A] block">Объем</span>
                    <span className="font-semibold text-[#232120] truncate block">{work.volume || '—'}</span>
                  </div>
                </div>

                {/* Tags */}
                {work.tags && work.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {work.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[9px] px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#8C6D3F]">
                        #{tag}
                      </span>
                    ))}
                    {work.tags.length > 3 && (
                      <span className="text-[9px] text-[#8C827A] self-center">
                        +{work.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Portfolio Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E8E3DA] pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#8C6D3F]" />
                <h3 className="font-serif text-xl font-medium text-[#232120]">
                  {editingItem ? 'Редактировать работу' : 'Добавить фото в портфолио'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-[#8C827A] hover:text-[#232120] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className="text-[#232120] font-semibold block">
                  Фотография работы:
                </label>
                
                {formImageUrl ? (
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-[#DFCFC0] bg-white group">
                    <img
                      src={formImageUrl}
                      alt="Превью"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black cursor-pointer"
                      title="Удалить фото"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#DFCFC0] rounded-2xl p-5 text-center bg-white space-y-3">
                    <Upload className="w-8 h-8 mx-auto text-[#B08D57]" />
                    <div>
                      <p className="font-medium text-[#232120]">Загрузите файл с устройства</p>
                      <p className="text-[10px] text-[#8C827A]">PNG, JPG, WEBP до 5 МБ</p>
                    </div>
                    <div>
                      <label className="inline-block bg-[#FAF0E6] text-[#8C6D3F] border border-[#E8D6C0] px-3 py-1.5 rounded-xl font-medium cursor-pointer hover:bg-[#F2ECE4]">
                        <span>Выбрать файл на устройстве</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Direct URL input fallback */}
                <div className="pt-1">
                  <label className="text-[10px] text-[#8C827A] block mb-0.5">Или введите прямую ссылку на фото (URL):</label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120] focus:outline-none focus:border-[#483F38]"
                  />
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[#232120] font-semibold block mb-1">Название работы:</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Например: Мокрый эффект 2D"
                    className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120] focus:outline-none focus:border-[#483F38]"
                  />
                </div>

                <div>
                  <label className="text-[#232120] font-semibold block mb-1">Категория:</label>
                  <select
                    value={formCategory}
                    onChange={(e: any) => setFormCategory(e.target.value)}
                    className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120] focus:outline-none focus:border-[#483F38]"
                  >
                    <option value="lashes">Наращивание</option>
                    <option value="lamination">Ламинирование</option>
                    <option value="brows">Брови</option>
                    <option value="effects">Трендовые эффекты</option>
                  </select>
                </div>
              </div>

              {/* Specs: Curl, Length, Volume */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[#6E6259] block mb-1">Изгиб:</label>
                  <input
                    type="text"
                    value={formCurl}
                    onChange={(e) => setFormCurl(e.target.value)}
                    placeholder="Изгиб C / D / L"
                    className="w-full bg-white border border-[#E5E0D8] rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[#6E6259] block mb-1">Длина:</label>
                  <input
                    type="text"
                    value={formLength}
                    onChange={(e) => setFormLength(e.target.value)}
                    placeholder="8–12 мм"
                    className="w-full bg-white border border-[#E5E0D8] rounded-xl p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[#6E6259] block mb-1">Объем:</label>
                  <input
                    type="text"
                    value={formVolume}
                    onChange={(e) => setFormVolume(e.target.value)}
                    placeholder="2D / 1.5D / Классика"
                    className="w-full bg-white border border-[#E5E0D8] rounded-xl p-2 text-xs"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[#232120] font-semibold block mb-1">Описание работы для клиентов:</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Особенности эффекта, кому подходит, мягкость носки..."
                  className="w-full bg-white border border-[#E5E0D8] rounded-xl p-2.5 text-xs text-[#232120] focus:outline-none focus:border-[#483F38]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="text-[#6E6259] block mb-1">Теги (через запятую):</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="Лисий эффект, Бархатный объем, Невесомо"
                  className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3 border-t border-[#E8E3DA]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#483F38] hover:bg-[#232120] text-white py-2.5 rounded-xl font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Сохранение...' : (editingItem ? 'Сохранить изменения' : 'Добавить в портфолио')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-white border border-[#D8CEC4] text-[#232120] py-2.5 rounded-xl font-medium hover:bg-[#EFECE6] transition-colors cursor-pointer"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Photo Zoom Modal */}
      {previewZoomItem && (
        <div 
          onClick={() => setPreviewZoomItem(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn cursor-zoom-out"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-[#FAF8F5] rounded-3xl overflow-hidden max-w-2xl w-full border border-white/20 shadow-2xl cursor-default"
          >
            <div className="relative aspect-[4/3] bg-black">
              <img
                src={previewZoomItem.imageUrl}
                alt={previewZoomItem.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setPreviewZoomItem(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-serif text-xl font-medium text-[#232120]">
                  {previewZoomItem.title}
                </h3>
                <span className="text-xs bg-[#FAF0E6] text-[#8C6D3F] border border-[#E8D6C0] px-2.5 py-0.5 rounded-full font-medium">
                  {previewZoomItem.categoryLabel || previewZoomItem.category}
                </span>
              </div>
              <p className="text-xs text-[#6E6259] leading-relaxed">
                {previewZoomItem.description}
              </p>
              <div className="flex gap-4 pt-2 text-xs text-[#8C6D3F] font-medium border-t border-[#EAE3D9]">
                <span>Изгиб: {previewZoomItem.curl || '—'}</span>
                <span>Длина: {previewZoomItem.length || '—'}</span>
                <span>Объем: {previewZoomItem.volume || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
