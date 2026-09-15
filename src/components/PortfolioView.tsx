import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  Maximize2, 
  X, 
  CalendarPlus, 
  Eye, 
  CheckCircle2, 
  Grid, 
  SlidersHorizontal 
} from 'lucide-react';
import { PortfolioItem } from '../types.ts';
import { PORTFOLIO_WORKS } from '../data/portfolioData.ts';

interface PortfolioViewProps {
  onBookWork: (serviceId?: string, noteTitle?: string) => void;
  onOpenBot?: () => void;
  works?: PortfolioItem[];
}

export const PortfolioView: React.FC<PortfolioViewProps> = ({ onBookWork, onOpenBot, works: initialWorks }) => {
  const [works, setWorks] = useState<PortfolioItem[]>(initialWorks || PORTFOLIO_WORKS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [zoomImage, setZoomImage] = useState<PortfolioItem | null>(null);
  const [viewMode, setViewMode] = useState<'carousel' | 'grid'>('carousel');

  useEffect(() => {
    if (initialWorks) {
      setWorks(initialWorks);
    } else {
      fetch('/api/portfolio')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setWorks(data);
          }
        })
        .catch(() => {
          // fallback to PORTFOLIO_WORKS
        });
    }
  }, [initialWorks]);

  const filteredWorks = selectedCategory === 'all'
    ? works
    : works.filter(w => w.category === selectedCategory);

  // Keep index within bounds if category filter changes
  const activeIndex = currentIndex >= filteredWorks.length ? 0 : currentIndex;
  const currentWork = filteredWorks[activeIndex] || filteredWorks[0];

  const handleNext = () => {
    setCurrentIndex(prev => (prev + 1) % filteredWorks.length);
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev - 1 + filteredWorks.length) % filteredWorks.length);
  };

  const categories = [
    { id: 'all', label: 'Все работы' },
    { id: 'lashes', label: 'Наращивание' },
    { id: 'lamination', label: 'Ламинирование' },
    { id: 'brows', label: 'Брови' },
    { id: 'effects', label: 'Трендовые эффекты' },
  ];

  return (
    <div className="space-y-4 animate-fadeIn pb-4">
      {/* Section Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF0E6] text-[#8C6D3F] border border-[#E8D6C0] text-[10px] uppercase tracking-wider font-medium">
          <Sparkles className="w-3 h-3 text-[#B08D57]" />
          <span>Работы студии Lashm.anya</span>
        </div>
        <h2 className="font-serif text-2xl font-medium text-[#232120]">
          Портфолио
        </h2>
        <p className="text-xs text-[#7A6E66] max-w-xs mx-auto">
          Натуральные объёмы, деликатные изгибы и бережная техника
        </p>
      </div>

      {/* Category Pills & Layout Toggle */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 px-1">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              id={`portfolio-cat-${cat.id}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentIndex(0);
              }}
              className={`text-xs px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer font-medium ${
                selectedCategory === cat.id
                  ? 'bg-[#483F38] text-white shadow-2xs'
                  : 'bg-white text-[#6E6259] border border-[#E5E0D8] hover:bg-[#FAF6F0]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* View Toggle (Carousel vs Grid) */}
        <div className="flex items-center bg-[#EFECE6] p-0.5 rounded-xl shrink-0">
          <button
            onClick={() => setViewMode('carousel')}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              viewMode === 'carousel' ? 'bg-white text-[#232120] shadow-2xs' : 'text-[#8C827A]'
            }`}
            title="Карусель"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-white text-[#232120] shadow-2xs' : 'text-[#8C827A]'
            }`}
            title="Сетка"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CAROUSEL VIEW */}
      {viewMode === 'carousel' && currentWork && (
        <div className="space-y-3">
          {/* Main Carousel Slide Card */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-xs relative">
            {/* Image Container with Aspect Ratio */}
            <div className="relative aspect-4/3 sm:aspect-16/10 bg-[#232120] overflow-hidden group">
              <img
                src={currentWork.imageUrl}
                alt={currentWork.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              
              {/* Dark subtle gradient overlay for contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

              {/* Category Pill Tag */}
              <span className="absolute top-3 left-3 bg-[#FAF8F5]/90 backdrop-blur-xs text-[#232120] text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/60 uppercase tracking-wider">
                {currentWork.categoryLabel}
              </span>

              {/* Zoom Button */}
              <button
                id="btn-portfolio-zoom"
                onClick={() => setZoomImage(currentWork)}
                className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-xs transition-colors cursor-pointer"
                title="Увеличить фото"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Slide Navigation Arrows */}
              <button
                id="btn-portfolio-prev"
                onClick={handlePrev}
                aria-label="Предыдущее фото"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#232120] flex items-center justify-center backdrop-blur-xs shadow-md transition-all cursor-pointer hover:scale-105"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                id="btn-portfolio-next"
                onClick={handleNext}
                aria-label="Следующее фото"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#232120] flex items-center justify-center backdrop-blur-xs shadow-md transition-all cursor-pointer hover:scale-105"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Bottom Carousel Indicators */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {filteredWorks.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      idx === activeIndex
                        ? 'w-6 bg-white'
                        : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Перейти к слайду ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Slide Information & Work Specs */}
            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-medium text-[#232120]">
                    {currentWork.title}
                  </h3>
                  <span className="text-xs text-[#8C6D3F] font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#B08D57]" />
                    <span>{currentWork.duration}</span>
                  </span>
                </div>
                <p className="text-xs text-[#6E6259] leading-relaxed mt-1">
                  {currentWork.description}
                </p>
              </div>

              {/* Technical Parameters Matrix */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#FAF8F5] border border-[#EFECE6] p-2 rounded-xl">
                  <span className="block text-[9px] text-[#A09890] uppercase">Изгиб</span>
                  <span className="text-xs font-medium text-[#483F38]">{currentWork.curl || 'Подбор'}</span>
                </div>
                <div className="bg-[#FAF8F5] border border-[#EFECE6] p-2 rounded-xl">
                  <span className="block text-[9px] text-[#A09890] uppercase">Длина</span>
                  <span className="text-xs font-medium text-[#483F38]">{currentWork.length || 'Анатомич.'}</span>
                </div>
                <div className="bg-[#FAF8F5] border border-[#EFECE6] p-2 rounded-xl">
                  <span className="block text-[9px] text-[#A09890] uppercase">Объем</span>
                  <span className="text-xs font-medium text-[#483F38]">{currentWork.volume || '1.5D'}</span>
                </div>
              </div>

              {/* Action: Book This Style */}
              <button
                id="btn-book-this-style"
                onClick={() => onBookWork(currentWork.serviceId, currentWork.title)}
                className="w-full bg-[#483F38] hover:bg-[#232120] text-white py-2.5 px-4 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <CalendarPlus className="w-4 h-4 text-[#E8DFD5]" />
                <span>Хочу такой же результат 🤍</span>
              </button>
            </div>
          </div>

          {/* Quick Thumbnails Strip */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5">
            {filteredWorks.map((work, idx) => (
              <button
                key={work.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  idx === activeIndex
                    ? 'border-[#483F38] scale-105 shadow-2xs'
                    : 'border-[#E5E0D8] opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={work.imageUrl}
                  alt={work.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 gap-2.5">
          {filteredWorks.map((work) => (
            <div
              key={work.id}
              className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden shadow-2xs flex flex-col group"
            >
              <div 
                className="relative aspect-square bg-[#232120] overflow-hidden cursor-pointer"
                onClick={() => setZoomImage(work)}
              >
                <img
                  src={work.imageUrl}
                  alt={work.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-md backdrop-blur-xs font-medium">
                  {work.curl || work.categoryLabel}
                </span>
              </div>
              <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="font-serif text-xs font-medium text-[#232120] line-clamp-1">
                    {work.title}
                  </h4>
                  <p className="text-[10px] text-[#7A6E66] line-clamp-2 mt-0.5">
                    {work.description}
                  </p>
                </div>
                <button
                  onClick={() => onBookWork(work.serviceId, work.title)}
                  className="w-full bg-[#FAF6F0] hover:bg-[#483F38] hover:text-white text-[#483F38] border border-[#E2D8CC] py-1.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                >
                  Записаться
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Photo Modal / Zoom Lightbox */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col justify-between p-4 animate-fadeIn"
          onClick={() => setZoomImage(null)}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white shrink-0">
            <div>
              <h4 className="font-serif text-base font-medium">{zoomImage.title}</h4>
              <p className="text-xs text-white/70">{zoomImage.curl} · {zoomImage.length} · {zoomImage.volume}</p>
            </div>
            <button
              onClick={() => setZoomImage(null)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Centered Large Image */}
          <div 
            className="flex-1 flex items-center justify-center my-auto p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomImage.imageUrl}
              alt={zoomImage.title}
              referrerPolicy="no-referrer"
              className="max-h-[60vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
          </div>

          {/* Bottom Action in Lightbox */}
          <div 
            className="text-center pb-2 shrink-0 max-w-xs mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                const srvId = zoomImage.serviceId;
                const title = zoomImage.title;
                setZoomImage(null);
                onBookWork(srvId, title);
              }}
              className="w-full bg-[#B08D57] hover:bg-[#9B7A48] text-white py-3 px-4 rounded-xl text-xs font-medium transition-colors shadow-lg cursor-pointer"
            >
              Записаться на «{zoomImage.title}»
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
