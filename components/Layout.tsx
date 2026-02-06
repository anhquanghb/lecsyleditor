
import React, { useState } from 'react';
import { TRANSLATIONS } from '../constants';
import { AppState, Language } from '../types';
import { Settings, Users, LogOut, ShieldCheck, Menu, X, ChevronLeft, ChevronRight, UserCog, FileJson, Briefcase } from 'lucide-react';

interface LayoutProps {
  state: AppState;
  setLanguage: (lang: Language) => void;
  currentModule: string;
  setCurrentModule: (mod: string) => void;
  children: React.ReactNode;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ state, setLanguage, currentModule, setCurrentModule, children, onLogout }) => {
  const { language, currentUser } = state;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const t = TRANSLATIONS[language];

  // Default guest avatar and info if no user logged in
  const defaultAvatar = "https://ui-avatars.com/api/?name=Guest&background=64748b&color=fff";
  const displayAvatar = currentUser?.avatar || defaultAvatar;
  const displayName = currentUser?.name || "Guest User";
  const displayRole = currentUser?.role || "VISITOR";

  const menuItems = [
    // { id: 'strategy', icon: 'fa-bullseye', label: t.strategy },
    // { id: 'outcomes', icon: 'fa-award', label: t.outcomes },
    // { id: 'mapping', icon: 'fa-table-cells', label: t.mapping },
    // { id: 'flowchart', icon: 'fa-diagram-project', label: t.flowchart },
    // { id: 'departments', icon: 'fa-sitemap', label: t.departments },
    { id: 'syllabus', icon: 'fa-file-lines', label: t.syllabus },
    { id: 'library', icon: 'fa-book', label: t.library },
    { id: 'faculty', icon: 'fa-users', label: t.faculty },
    // { id: 'facilities', icon: 'fa-building', label: t.facilities },
    // { id: 'analytics', icon: 'fa-brain', label: t.analytics },
    // { id: 'general', icon: 'fa-info-circle', label: t.general },
    // { id: 'transformation', icon: 'fa-random', label: t.transformation },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 shrink-0">
        <div className={`flex items-center gap-3 w-full ${!isSidebarOpen ? 'justify-center' : ''}`}>
            {/* Logo Icon */}
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-indigo-900/50">
               <i className="fas fa-graduation-cap text-white text-sm"></i>
            </div>
            
            {/* Logo Text - Hidden when collapsed */}
            <div className={`overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">DTU Lec-Editor</span>
            </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className={`p-4 bg-slate-800/30 flex items-center gap-3 border-b border-slate-800 overflow-hidden ${!isSidebarOpen ? 'lg:justify-center' : ''}`}>
        <img 
          src={displayAvatar} 
          className="w-10 h-10 rounded-full border-2 border-indigo-500/30 shrink-0" 
          alt="avatar" 
        />
        {isSidebarOpen && (
          <div className="min-w-0 flex-1 animate-in fade-in slide-in-from-left-2">
            <div className="text-xs font-bold text-white truncate">{displayName}</div>
            <div className="mt-1">
              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                displayRole === 'ADMIN' ? 'bg-indigo-600 text-white' : 'bg-slate-600 text-slate-300'
              }`}>
                {displayRole}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => {
              setCurrentModule(item.id);
              if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group ${
              currentModule === item.id 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
            title={!isSidebarOpen ? item.label : ''}
          >
            <div className={`w-5 flex justify-center shrink-0 ${!isSidebarOpen ? 'text-lg' : 'text-base'}`}>
               <i className={`fas ${item.icon}`}></i>
            </div>
            {(isSidebarOpen || window.innerWidth < 1024) && (
              <span className="font-medium text-xs truncate animate-in fade-in slide-in-from-left-1">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        {/* JSON Input Tool */}
        <button
          onClick={() => {
            setCurrentModule('json-input');
            if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
            currentModule === 'json-input' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
          title="JSON Input"
        >
          <div className="w-5 flex justify-center shrink-0"><FileJson size={18} /></div>
          {(isSidebarOpen || window.innerWidth < 1024) && (
            <span className="font-medium text-xs animate-in fade-in slide-in-from-left-1">{language === 'vi' ? 'Nhập/Xuất dữ liệu JSON' : 'JSON Input'}</span>
          )}
        </button>

        {/* Settings - HIDDEN 
        <button
          onClick={() => {
            setCurrentModule('settings');
            if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
            currentModule === 'settings' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
          title={t.settings}
        >
          <div className="w-5 flex justify-center shrink-0"><Settings size={18} /></div>
          {(isSidebarOpen || window.innerWidth < 1024) && (
            <span className="font-medium text-xs animate-in fade-in slide-in-from-left-1">{t.settings}</span>
          )}
        </button>
        */}

        {/* User Management (Admin Only) */}
        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => {
              setCurrentModule('users');
              if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
              currentModule === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            } ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
            title={t.users}
          >
            <div className="w-5 flex justify-center shrink-0"><UserCog size={18} /></div>
            {(isSidebarOpen || window.innerWidth < 1024) && (
              <span className="font-medium text-xs animate-in fade-in slide-in-from-left-1">{t.users}</span>
            )}
          </button>
        )}
        
        {/* Logout */}
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-left ${!isSidebarOpen ? 'lg:justify-center lg:px-2' : ''}`}
          title={t.logout}
        >
          <div className="w-5 flex justify-center shrink-0"><LogOut size={18} /></div>
          {(isSidebarOpen || window.innerWidth < 1024) && (
            <span className="font-medium text-xs animate-in fade-in slide-in-from-left-1">{t.logout}</span>
          )}
        </button>

        {/* Language Selection */}
        {(isSidebarOpen || window.innerWidth < 1024) ? (
          <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-black px-3 pt-4 tracking-widest animate-in fade-in">
            <span>Lang</span>
            <div className="flex gap-3">
              <button onClick={() => setLanguage('vi')} className={language === 'vi' ? 'text-indigo-400' : 'hover:text-slate-300'}>VI</button>
              <button onClick={() => setLanguage('en')} className={language === 'en' ? 'text-indigo-400' : 'hover:text-slate-300'}>EN</button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center pt-4 text-[10px] font-black text-slate-600 cursor-pointer" onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')} title="Toggle Language">
            {language.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden lg:flex flex-col shrink-0 transition-all duration-300 ease-in-out border-r border-slate-800 relative z-20 ${
          isSidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        <SidebarContent />
        
        {/* Floating Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-md"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100] flex">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={toggleMobileMenu}></div>
          <aside className="relative w-72 h-full shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Mobile Sidebar Close Button */}
            <button 
                onClick={toggleMobileMenu} 
                className="absolute right-4 top-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white z-50"
            >
                <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden text-left">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleMobileMenu} 
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-lg lg:text-xl font-bold text-slate-800 tracking-tight truncate max-w-[200px] md:max-w-none">
              {menuItems.find(m => m.id === currentModule)?.label || (currentModule === 'settings' ? t.settings : currentModule === 'users' ? t.users : currentModule === 'json-input' ? (language === 'vi' ? 'Nhập JSON' : 'JSON Input') : '')}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider items-center gap-2 border border-emerald-100 shadow-sm">
               <ShieldCheck size={14} /> Duy Tan University 2026
             </div>
          </div>
        </header>

        {/* Dynamic Module Content */}
        <section className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
