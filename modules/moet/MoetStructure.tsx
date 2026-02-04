
import React, { useState, useMemo } from 'react';
import { AppState, MoetSubBlock } from '../../types';
import { BoxSelect, Plus, Trash2, Layers, X, FolderOpen, AlertCircle, Bookmark } from 'lucide-react';
import { StructureTable } from './MoetShared';

interface Props {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

const MoetStructure: React.FC<Props> = ({ state, updateState }) => {
  const { generalInfo, language, courses } = state;
  const moetInfo = generalInfo.moetInfo;
  
  // State for Type Selection Modal (Moving courses between blocks)
  const [moveCourseData, setMoveCourseData] = useState<{ 
      courseId: string, 
      currentLocation: string, // 'root' or subBlockId
      currentParent: 'gen' | 'phys' | 'fund' | 'spec' | 'grad',
      targetType: 'REQUIRED' | 'ELECTIVE' | 'SELECTED_ELECTIVE' 
  } | null>(null);

  // --- Calculate Global Used IDs to prevent selection in multiple blocks ---
  const allUsedCourseIds = useMemo(() => {
      const ps = moetInfo.programStructure;
      const rootIds = [
          ...(ps.gen || []), 
          ...(ps.phys || []),
          ...(ps.fund || []), 
          ...(ps.spec || []), 
          ...(ps.grad || [])
      ];
      const subIds = (moetInfo.subBlocks || []).flatMap(sb => sb.courseIds);
      return Array.from(new Set([...rootIds, ...subIds]));
  }, [moetInfo]);

  const updateMoetField = (field: keyof typeof moetInfo, value: any) => {
    updateState(prev => ({
      ...prev,
      generalInfo: {
        ...prev.generalInfo,
        moetInfo: { ...prev.generalInfo.moetInfo, [field]: value }
      }
    }));
  };

  const updateCourseRelation = (courseId: string, field: 'prerequisites' | 'coRequisites', value: string[]) => {
      updateState(prev => ({
          ...prev,
          courses: prev.courses.map(c => c.id === courseId ? { ...c, [field]: value } : c)
      }));
  };

  // --- ROOT (Direct Parent) Management ---
  const addCourseToRoot = (parentBlockId: 'gen' | 'phys' | 'fund' | 'spec' | 'grad', courseId: string) => {
      const currentList = moetInfo.programStructure[parentBlockId] || [];
      if (currentList.includes(courseId)) return;

      updateState(prev => ({
          ...prev,
          courses: prev.courses.map(c => c.id === courseId ? { ...c, type: 'REQUIRED' } : c),
          generalInfo: {
              ...prev.generalInfo,
              moetInfo: {
                  ...prev.generalInfo.moetInfo,
                  programStructure: {
                      ...prev.generalInfo.moetInfo.programStructure,
                      [parentBlockId]: [...currentList, courseId]
                  }
              }
          }
      }));
  };

  const removeCourseFromRoot = (parentBlockId: 'gen' | 'phys' | 'fund' | 'spec' | 'grad', courseId: string) => {
      const currentList = moetInfo.programStructure[parentBlockId] || [];
      updateMoetField('programStructure', {
          ...moetInfo.programStructure,
          [parentBlockId]: currentList.filter(id => id !== courseId)
      });
  };

  // --- Sub-Block Management ---
  const addBlock = (parentBlockId: 'gen' | 'phys' | 'fund' | 'spec' | 'grad', type: 'COMPULSORY' | 'ELECTIVE') => {
      const newBlock: MoetSubBlock = {
          id: `sb-${Date.now()}`,
          name: type === 'COMPULSORY' 
            ? { vi: 'Nhóm bắt buộc mới', en: 'New Compulsory Group' }
            : { vi: 'Khối tự chọn mới', en: 'New Elective Block' },
          parentBlockId,
          type,
          minCredits: type === 'COMPULSORY' ? 0 : 3,
          courseIds: [],
          note: { vi: '', en: '' }
      };
      updateMoetField('subBlocks', [...(moetInfo.subBlocks || []), newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<MoetSubBlock>) => {
      const next = (moetInfo.subBlocks || []).map(sb => sb.id === id ? { ...sb, ...updates } : sb);
      updateMoetField('subBlocks', next);
  };

  const deleteBlock = (id: string) => {
      if(!confirm(language === 'vi' ? 'Xóa khối này? Các môn học bên trong sẽ bị loại khỏi chương trình.' : 'Delete this block? Courses inside will be removed from the program structure.')) return;
      updateMoetField('subBlocks', (moetInfo.subBlocks || []).filter(sb => sb.id !== id));
  };

  const addCourseToSubBlock = (blockId: string, courseId: string) => {
      const targetBlock = moetInfo.subBlocks?.find(sb => sb.id === blockId);
      if (!targetBlock) return;

      const nextSubBlocks = (moetInfo.subBlocks || []).map(sb => {
          if (sb.id === blockId && !sb.courseIds.includes(courseId)) return { ...sb, courseIds: [...sb.courseIds, courseId] };
          return sb;
      });

      // Update type based on block type
      const newType = targetBlock.type === 'COMPULSORY' ? 'REQUIRED' : 'ELECTIVE';

      updateState(prev => ({
          ...prev,
          courses: prev.courses.map(c => c.id === courseId ? { ...c, type: newType } : c),
          generalInfo: {
              ...prev.generalInfo,
              moetInfo: {
                  ...prev.generalInfo.moetInfo,
                  subBlocks: nextSubBlocks
              }
          }
      }));
  };

  const removeCourseFromSubBlock = (blockId: string, courseId: string) => {
      const nextSubBlocks = (moetInfo.subBlocks || []).map(sb => {
          if (sb.id === blockId) return { ...sb, courseIds: sb.courseIds.filter(id => id !== courseId) };
          return sb;
      });
      updateMoetField('subBlocks', nextSubBlocks);
  };

  // --- Complex Move / Type Change Logic ---
  const handleTypeChangeRequest = (
      courseId: string, 
      newType: 'REQUIRED' | 'ELECTIVE' | 'SELECTED_ELECTIVE', 
      currentLocation: string, // 'root' or blockId
      currentParent: 'gen' | 'phys' | 'fund' | 'spec' | 'grad'
  ) => {
      // 1. If changing to ELECTIVE/SELECTED_ELECTIVE
      if (newType !== 'REQUIRED') {
          // Must verify there are elective blocks available or create one
          const electiveBlocks = (moetInfo.subBlocks || []).filter(sb => sb.parentBlockId === currentParent && sb.type !== 'COMPULSORY');
          
          if (electiveBlocks.length === 0) {
              // Create default elective block and move there
              const newBlockId = `sb-elec-auto-${Date.now()}`;
              const newBlock: MoetSubBlock = {
                  id: newBlockId,
                  name: { vi: 'Khối tự chọn', en: 'Elective Block' },
                  parentBlockId: currentParent,
                  type: 'ELECTIVE',
                  minCredits: 3,
                  courseIds: [courseId],
                  note: { vi: '', en: '' }
              };
              
              // Remove from old location
              let nextProgramStructure = { ...moetInfo.programStructure };
              let nextSubBlocks = [...(moetInfo.subBlocks || [])];

              if (currentLocation === 'root') {
                  nextProgramStructure[currentParent] = (nextProgramStructure[currentParent] || []).filter(id => id !== courseId);
              } else {
                  nextSubBlocks = nextSubBlocks.map(sb => sb.id === currentLocation ? { ...sb, courseIds: sb.courseIds.filter(id => id !== courseId) } : sb);
              }

              updateState(prev => ({
                  ...prev,
                  courses: prev.courses.map(c => c.id === courseId ? { ...c, type: newType } : c),
                  generalInfo: {
                      ...prev.generalInfo,
                      moetInfo: {
                          ...prev.generalInfo.moetInfo,
                          programStructure: nextProgramStructure,
                          subBlocks: [...nextSubBlocks, newBlock]
                      }
                  }
              }));
          } else {
              // Show modal to choose which elective block
              setMoveCourseData({ courseId, currentLocation, currentParent, targetType: newType });
          }
      } 
      // 2. If changing to REQUIRED
      else {
          // Show modal to choose "Root" or specific "Compulsory Block"
          setMoveCourseData({ courseId, currentLocation, currentParent, targetType: 'REQUIRED' });
      }
  };

  const confirmMove = (targetLocation: string) => { // targetLocation: 'root' or blockId
      if (!moveCourseData) return;
      const { courseId, currentLocation, currentParent, targetType } = moveCourseData;

      // 1. Remove from old location
      let nextProgramStructure = { ...moetInfo.programStructure };
      let nextSubBlocks = [...(moetInfo.subBlocks || [])];

      if (currentLocation === 'root') {
          nextProgramStructure[currentParent] = (nextProgramStructure[currentParent] || []).filter(id => id !== courseId);
      } else {
          nextSubBlocks = nextSubBlocks.map(sb => sb.id === currentLocation ? { ...sb, courseIds: sb.courseIds.filter(id => id !== courseId) } : sb);
      }

      // 2. Add to new location
      if (targetLocation === 'root') {
          const currentRoot = nextProgramStructure[currentParent] || [];
          if (!currentRoot.includes(courseId)) nextProgramStructure[currentParent] = [...currentRoot, courseId];
      } else {
          nextSubBlocks = nextSubBlocks.map(sb => sb.id === targetLocation ? { ...sb, courseIds: [...sb.courseIds, courseId] } : sb);
      }

      updateState(prev => ({
          ...prev,
          courses: prev.courses.map(c => c.id === courseId ? { ...c, type: targetType } : c),
          generalInfo: {
              ...prev.generalInfo,
              moetInfo: {
                  ...prev.generalInfo.moetInfo,
                  programStructure: nextProgramStructure,
                  subBlocks: nextSubBlocks
              }
          }
      }));
      setMoveCourseData(null);
  };

  // --- Helper to sum credits ---
  const getBlockCredits = (courseIds: string[]) => {
      return courseIds.reduce((sum, cid) => {
          const c = courses.find(course => course.id === cid);
          return sum + (c?.credits || 0);
      }, 0);
  };

  return (
    <>
      {/* Move/Change Type Modal */}
      {moveCourseData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">{language === 'vi' ? 'Chọn vị trí chuyển đến' : 'Select Target Location'}</h3>
                      <button onClick={() => setMoveCourseData(null)}><X size={20} className="text-slate-400"/></button>
                  </div>
                  <div className="p-4 space-y-2">
                      <p className="text-sm text-slate-600 mb-4">
                          {language === 'vi' ? 'Bạn muốn chuyển môn học này vào nhóm nào?' : 'Where do you want to move this course?'}
                      </p>
                      
                      {/* Option: Root Compulsory (Only if target is REQUIRED) */}
                      {moveCourseData.targetType === 'REQUIRED' && (
                          <button 
                              onClick={() => confirmMove('root')}
                              className="w-full text-left p-3 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-all text-sm font-bold text-indigo-700 flex items-center gap-2"
                          >
                              <Bookmark size={16}/>
                              {language === 'vi' ? 'Danh sách Bắt buộc chung' : 'General Compulsory List'}
                          </button>
                      )}

                      {/* Options: Sub Blocks */}
                      {(moetInfo.subBlocks || [])
                        .filter(sb => {
                            return sb.parentBlockId === moveCourseData.currentParent && 
                                   sb.id !== moveCourseData.currentLocation &&
                                   (moveCourseData.targetType === 'REQUIRED' ? sb.type === 'COMPULSORY' : sb.type !== 'COMPULSORY');
                        })
                        .map(sb => (
                          <button 
                              key={sb.id}
                              onClick={() => confirmMove(sb.id)}
                              className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-white transition-all text-sm font-medium flex justify-between"
                          >
                              <span>{sb.name[language]}</span>
                              <span className="text-xs text-slate-400">{sb.type === 'COMPULSORY' ? 'Compulsory' : 'Elective'}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50"><h3 className="font-bold text-slate-800 flex items-center gap-2"><BoxSelect size={18} className="text-emerald-600"/>{language === 'vi' ? '4. Cấu trúc chương trình' : '4. Program Structure'}</h3></div>
          <div className="p-6 space-y-12">
              {[
                  { id: 'gen', title: { vi: 'Kiến thức giáo dục đại cương', en: 'General Education' } },
                  { id: 'phys', title: { vi: 'Giáo dục thể chất', en: 'Physical Education' } },
                  { id: 'fund', title: { vi: 'Kiến thức cơ sở ngành', en: 'Fundamental Engineering' } },
                  { id: 'spec', title: { vi: 'Kiến thức chuyên ngành', en: 'Specialized Engineering' } },
                  { id: 'grad', title: { vi: 'Tốt nghiệp', en: 'Graduation' } }
              ].map(block => {
                  const rootCompulsoryIds = moetInfo.programStructure[block.id as keyof typeof moetInfo.programStructure] || [];
                  const parentSubBlocks = (moetInfo.subBlocks || []).filter(sb => sb.parentBlockId === block.id);
                  const compBlocks = parentSubBlocks.filter(sb => sb.type === 'COMPULSORY');
                  const elecBlocks = parentSubBlocks.filter(sb => sb.type !== 'COMPULSORY');

                  return (
                      <div key={block.id} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-md">
                          <h4 className="font-bold text-slate-800 mb-6 text-xl border-b-2 border-slate-100 pb-3 flex items-center gap-3">
                              <div className="w-1.5 h-8 bg-indigo-500 rounded-full"></div>
                              {language === 'vi' ? block.title.vi : block.title.en}
                          </h4>
                          
                          {/* 1. Compulsory Section */}
                          <div className="mb-10 space-y-6">
                              <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                                  <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px]">REQUIRED</span>
                                      {language === 'vi' ? 'Bắt buộc' : 'Compulsory'}
                                  </h5>
                                  <button onClick={() => addBlock(block.id as any, 'COMPULSORY')} className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200 flex items-center gap-1 transition-colors">
                                      <Plus size={12}/> {language === 'vi' ? 'Thêm Nhóm (Sub-block)' : 'Add Sub-block'}
                                  </button>
                              </div>

                              {/* 1a. Root Compulsory List */}
                              <div className="bg-slate-50/30 rounded-xl border border-slate-200 overflow-hidden">
                                  <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
                                      <Bookmark size={16} className="text-slate-500"/>
                                      <span className="text-sm font-bold text-slate-700">{language === 'vi' ? 'Danh sách bắt buộc chung' : 'General Compulsory List'}</span>
                                      <div className="ml-auto flex items-center gap-2 bg-white px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-600">
                                          <span>{getBlockCredits(rootCompulsoryIds)} credits</span>
                                      </div>
                                  </div>
                                  <div className="p-4">
                                      <StructureTable 
                                          courseIds={rootCompulsoryIds}
                                          courses={courses}
                                          language={language}
                                          onRemove={(cid) => removeCourseFromRoot(block.id as any, cid)}
                                          onAdd={(cid) => addCourseToRoot(block.id as any, cid)}
                                          onTypeChange={(cid, type) => handleTypeChangeRequest(cid, type, 'root', block.id as any)}
                                          onRelationUpdate={updateCourseRelation}
                                          excludeIds={allUsedCourseIds} 
                                          theme="slate"
                                      />
                                  </div>
                              </div>

                              {/* 1b. Named Compulsory Sub-blocks */}
                              {compBlocks.length > 0 && (
                                  <div className="pl-4 border-l-2 border-slate-100 space-y-4">
                                      <h6 className="text-xs font-bold text-slate-400 uppercase">{language === 'vi' ? 'Các nhóm bắt buộc cụ thể' : 'Specific Compulsory Groups'}</h6>
                                      {compBlocks.map(sb => (
                                          <div key={sb.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                              <div className="p-3 bg-white border-b border-slate-200 flex items-center gap-3">
                                                  <FolderOpen size={16} className="text-indigo-600"/>
                                                  <input 
                                                      className="flex-1 text-sm font-bold bg-transparent border-b border-transparent focus:border-indigo-400 outline-none text-indigo-900" 
                                                      value={sb.name[language]} 
                                                      onChange={e => updateBlock(sb.id, { name: { ...sb.name, [language]: e.target.value } })} 
                                                      placeholder="Block Name" 
                                                  />
                                                  <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs font-bold text-slate-600">
                                                      <span>{getBlockCredits(sb.courseIds)} credits</span>
                                                  </div>
                                                  <button onClick={() => deleteBlock(sb.id)} className="text-slate-300 hover:text-red-500 ml-2"><Trash2 size={14}/></button>
                                              </div>
                                              
                                              <div className="p-3">
                                                  <StructureTable 
                                                      courseIds={sb.courseIds}
                                                      courses={courses}
                                                      language={language}
                                                      onRemove={(cid) => removeCourseFromSubBlock(sb.id, cid)}
                                                      onAdd={(cid) => addCourseToSubBlock(sb.id, cid)}
                                                      onTypeChange={(cid, type) => handleTypeChangeRequest(cid, type, sb.id, block.id as any)}
                                                      onRelationUpdate={updateCourseRelation}
                                                      excludeIds={allUsedCourseIds} 
                                                      theme="slate"
                                                  />
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                              )}
                          </div>

                          {/* 2. Electives Section */}
                          <div className="space-y-6">
                              <div className="flex justify-between items-center mb-2 border-b border-slate-100 pb-2">
                                   <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                                      <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px]">ELECTIVE</span>
                                      {language === 'vi' ? 'Tự chọn' : 'Electives'}
                                   </h5>
                                   <button onClick={() => addBlock(block.id as any, 'ELECTIVE')} className="text-xs bg-amber-50 text-amber-600 font-bold px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 flex items-center gap-1 transition-colors">
                                      <Plus size={12}/> {language === 'vi' ? 'Thêm Khối TC' : 'Add Block'}
                                   </button>
                              </div>

                              {elecBlocks.length === 0 && (
                                  <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 text-sm italic bg-slate-50/50">
                                      {language === 'vi' ? 'Chưa có khối tự chọn nào trong phần này.' : 'No elective blocks defined for this section.'}
                                  </div>
                              )}

                              {elecBlocks.map(sb => (
                                  <div key={sb.id} className="bg-amber-50/20 rounded-xl border border-amber-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                      <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
                                          <Layers size={18} className="text-amber-600"/>
                                          <input 
                                              className="flex-1 text-sm font-bold bg-transparent border-b border-transparent focus:border-amber-400 outline-none text-amber-900 placeholder-amber-400" 
                                              value={sb.name[language]} 
                                              onChange={e => updateBlock(sb.id, { name: { ...sb.name, [language]: e.target.value } })} 
                                              placeholder="Block Name" 
                                          />
                                          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded border border-amber-100">
                                              <span className="text-[10px] font-bold text-amber-600 uppercase">Min Credits:</span>
                                              <input 
                                                  type="number" 
                                                  className="w-12 text-xs text-center bg-transparent border-none rounded font-bold text-amber-700 focus:ring-0 outline-none" 
                                                  value={sb.minCredits} 
                                                  onChange={e => updateBlock(sb.id, { minCredits: Number(e.target.value) })} 
                                              />
                                          </div>
                                          <button onClick={() => deleteBlock(sb.id)} className="text-amber-400 hover:text-red-500 ml-2 p-1 rounded hover:bg-white/50 transition-colors"><Trash2 size={16}/></button>
                                      </div>
                                      
                                      <div className="p-4">
                                          <StructureTable
                                              courseIds={sb.courseIds}
                                              courses={courses}
                                              language={language}
                                              onRemove={(cid) => removeCourseFromSubBlock(sb.id, cid)}
                                              onAdd={(cid) => addCourseToSubBlock(sb.id, cid)}
                                              onTypeChange={(cid, type) => handleTypeChangeRequest(cid, type, sb.id, block.id as any)}
                                              onRelationUpdate={updateCourseRelation}
                                              excludeIds={allUsedCourseIds} 
                                              theme="amber"
                                          />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  );
              })}
          </div>
      </section>
    </>
  );
};

export default MoetStructure;
