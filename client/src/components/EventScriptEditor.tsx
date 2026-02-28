import { useState, useEffect } from 'react';

interface EventScene {
  text: string;
  choices?: Array<{
    text: string;
    nextScene?: number;
    response?: string;
  }>;
}

interface EventScriptEditorProps {
  scenes: EventScene[];
  onSave: (scenes: EventScene[]) => void;
  onCancel: () => void;
}

const EventScriptEditor = ({ scenes, onSave, onCancel }: EventScriptEditorProps) => {
  const [eventScenes, setEventScenes] = useState<EventScene[]>(scenes);

  useEffect(() => {
    setEventScenes(scenes);
  }, [scenes]);

  const addScene = () => {
    setEventScenes([...eventScenes, { text: '', choices: [] }]);
  };

  const removeScene = (index: number) => {
    setEventScenes(eventScenes.filter((_, i) => i !== index));
  };

  const updateSceneText = (index: number, text: string) => {
    const newScenes = [...eventScenes];
    newScenes[index].text = text;
    setEventScenes(newScenes);
  };

  const addChoice = (sceneIndex: number) => {
    const newScenes = [...eventScenes];
    if (!newScenes[sceneIndex].choices) {
      newScenes[sceneIndex].choices = [];
    }
    newScenes[sceneIndex].choices!.push({ text: '', response: '' });
    setEventScenes(newScenes);
  };

  const removeChoice = (sceneIndex: number, choiceIndex: number) => {
    const newScenes = [...eventScenes];
    newScenes[sceneIndex].choices = newScenes[sceneIndex].choices?.filter((_, i) => i !== choiceIndex);
    setEventScenes(newScenes);
  };

  const updateChoice = (sceneIndex: number, choiceIndex: number, field: string, value: string | number | undefined) => {
    const newScenes = [...eventScenes];
    if (newScenes[sceneIndex].choices) {
      (newScenes[sceneIndex].choices![choiceIndex] as any)[field] = value;
    }
    setEventScenes(newScenes);
  };

  const handleSave = () => {
    onSave(eventScenes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">이벤트 스크립트 편집</h2>
        <div className="space-y-6">
          {eventScenes.map((scene, sceneIndex) => (
            <div key={sceneIndex} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">장면 {sceneIndex + 1}</h3>
                <button
                  onClick={() => removeScene(sceneIndex)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  삭제
                </button>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">장면 텍스트</label>
                <textarea
                  value={scene.text}
                  onChange={(e) => updateSceneText(sceneIndex, e.target.value)}
                  className="w-full px-3 py-2 border rounded text-black"
                  rows={3}
                  placeholder="장면에서 표시될 텍스트를 입력하세요..."
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">선택지</label>
                  <button
                    onClick={() => addChoice(sceneIndex)}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    선택지 추가
                  </button>
                </div>
                {scene.choices && scene.choices.length > 0 && (
                  <div className="space-y-2">
                    {scene.choices.map((choice, choiceIndex) => (
                      <div key={choiceIndex} className="border rounded p-3 bg-white">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">선택지 {choiceIndex + 1}</span>
                          <button
                            onClick={() => removeChoice(sceneIndex, choiceIndex)}
                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                          >
                            삭제
                          </button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">선택지 텍스트</label>
                            <input
                              type="text"
                              value={choice.text}
                              onChange={(e) => updateChoice(sceneIndex, choiceIndex, 'text', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-black text-sm"
                              placeholder="선택지 텍스트"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">응답 문구</label>
                            <textarea
                              value={choice.response || ''}
                              onChange={(e) => updateChoice(sceneIndex, choiceIndex, 'response', e.target.value)}
                              className="w-full px-2 py-1 border rounded text-black text-sm"
                              rows={2}
                              placeholder="선택 시 표시될 응답"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1">다음 장면 번호 (선택)</label>
                            <input
                              type="number"
                              value={choice.nextScene !== undefined ? choice.nextScene : ''}
                              onChange={(e) => updateChoice(sceneIndex, choiceIndex, 'nextScene', e.target.value ? parseInt(e.target.value) : undefined)}
                              className="w-full px-2 py-1 border rounded text-black text-sm"
                              placeholder="다음 장면 번호 (없으면 종료)"
                              min="1"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={addScene}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            장면 추가
          </button>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            저장
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventScriptEditor;







