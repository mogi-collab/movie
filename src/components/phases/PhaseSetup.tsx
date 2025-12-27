import { useState, useEffect } from 'react';
import { useProject as useProjectData } from '../../hooks/useProject';
import { DirectorInputs, TargetAudience } from '../../types';
import { AlertCircle } from 'lucide-react';

interface PhaseSetupProps {
  projectId: string;
}

const GENRES = [
  'Drama',
  'Thriller',
  'Romance',
  'Action',
  'Horror',
  'Comedy',
  'Sci-Fi',
  'Fantasy',
  'Documentary',
  'Animation',
  'Crime',
  'Adventure',
];

const PLATFORMS = [
  { id: 'theatre', label: 'Theatre' },
  { id: 'ott', label: 'OTT (Streaming)' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'short-film', label: 'Short Film' },
];

export default function PhaseSetup({ projectId }: PhaseSetupProps) {
  const { directorInputs, updateDirectorInputs, sliders, updateSliders, loading, error } = useProjectData(projectId);

  const [theme, setTheme] = useState('');
  const [message, setMessage] = useState('');
  const [emotionalTakeaway, setEmotionalTakeaway] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [platform, setPlatform] = useState<string>('ott');
  const [riskAppetite, setRiskAppetite] = useState(0.5);
  const [audienceDescription, setAudienceDescription] = useState('');
  const [culturalContext, setCulturalContext] = useState('');
  const [regionalContext, setRegionalContext] = useState('');

  const [emotionIntensity, setEmotionIntensity] = useState(0.5);
  const [tensionAggression, setTensionAggression] = useState(0.5);
  const [dialogueDensity, setDialogueDensity] = useState(0.5);
  const [visualSymbolism, setVisualSymbolism] = useState(0.5);
  const [pace, setPace] = useState(0.5);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (directorInputs) {
      setTheme(directorInputs.core_theme || '');
      setMessage(directorInputs.message || '');
      setEmotionalTakeaway(directorInputs.emotional_takeaway || '');
      setSelectedGenres(directorInputs.genre || []);
      setPlatform(directorInputs.platform || 'ott');
      setRiskAppetite(directorInputs.risk_appetite || 0.5);
      setCulturalContext(directorInputs.cultural_context || '');
      setRegionalContext(directorInputs.regional_context || '');
      if (directorInputs.target_audience) {
        setAudienceDescription(directorInputs.target_audience.description || '');
      }
    }

    if (sliders) {
      setEmotionIntensity(sliders.emotion_intensity || 0.5);
      setTensionAggression(sliders.tension_aggression || 0.5);
      setDialogueDensity(sliders.dialogue_density || 0.5);
      setVisualSymbolism(sliders.visual_symbolism || 0.5);
      setPace(sliders.pace || 0.5);
    }
  }, [directorInputs, sliders]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSave = async () => {
    if (!theme.trim()) {
      setSaveStatus('Please enter a core theme');
      return;
    }

    if (selectedGenres.length === 0) {
      setSaveStatus('Please select at least one genre');
      return;
    }

    try {
      setSaving(true);
      setSaveStatus(null);

      const targetAudience: TargetAudience = {
        description: audienceDescription,
      };

      const inputs: Partial<DirectorInputs> = {
        core_theme: theme,
        message,
        emotional_takeaway: emotionalTakeaway,
        genre: selectedGenres,
        platform: platform as any,
        risk_appetite: riskAppetite,
        target_audience: targetAudience,
        cultural_context: culturalContext,
        regional_context: regionalContext,
      };

      await updateDirectorInputs(inputs);

      await updateSliders({
        emotion_intensity: emotionIntensity,
        tension_aggression: tensionAggression,
        dialogue_density: dialogueDensity,
        visual_symbolism: visualSymbolism,
        pace,
      });

      setSaveStatus('Configuration saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save configuration';
      setSaveStatus(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-300">Loading setup...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-50 mb-2">Project Configuration</h2>
        <p className="text-slate-400">Define your creative vision and configure AI parameters</p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-950 border border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {saveStatus && (
        <div className={`p-4 rounded-lg ${saveStatus.includes('success') ? 'bg-green-950 border border-green-800 text-green-200' : 'bg-amber-950 border border-amber-800 text-amber-200'}`}>
          {saveStatus}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-6 bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-50 mb-6">Core Vision</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Core Theme</label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., Love, Revenge, Survival, Identity"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Core Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What do you want the audience to feel or understand?"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Emotional Takeaway</label>
                <textarea
                  value={emotionalTakeaway}
                  onChange={(e) => setEmotionalTakeaway(e.target.value)}
                  placeholder="What emotional journey should viewers experience?"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3">Genres</h4>
            <div className="grid grid-cols-2 gap-2">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-2 rounded-lg font-medium text-sm transition ${
                    selectedGenres.includes(genre)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3">Platform</h4>
            <div className="space-y-2">
              {PLATFORMS.map((p) => (
                <label key={p.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 cursor-pointer transition">
                  <input
                    type="radio"
                    name="platform"
                    value={p.id}
                    checked={platform === p.id}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span className="text-slate-200">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-3">Risk Appetite</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={riskAppetite}
                onChange={(e) => setRiskAppetite(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-sm font-medium text-slate-200 w-12">
                {riskAppetite < 0.4 ? 'Safe' : riskAppetite > 0.6 ? 'Bold' : 'Balanced'}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-6 bg-slate-900 rounded-lg border border-slate-700 p-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-50 mb-6">Control Sliders</h3>
            <p className="text-sm text-slate-400 mb-6">Fine-tune the AI's creative output</p>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-200">Emotion Intensity</label>
                  <span className="text-xs text-slate-400">{Math.round(emotionIntensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={emotionIntensity}
                  onChange={(e) => setEmotionIntensity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-200">Tension Aggression</label>
                  <span className="text-xs text-slate-400">{Math.round(tensionAggression * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={tensionAggression}
                  onChange={(e) => setTensionAggression(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-200">Dialogue Density</label>
                  <span className="text-xs text-slate-400">{Math.round(dialogueDensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={dialogueDensity}
                  onChange={(e) => setDialogueDensity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-200">Visual Symbolism</label>
                  <span className="text-xs text-slate-400">{Math.round(visualSymbolism * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={visualSymbolism}
                  onChange={(e) => setVisualSymbolism(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-slate-200">Pace</label>
                  <span className="text-xs text-slate-400">{Math.round(pace * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={pace}
                  onChange={(e) => setPace(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-sm font-semibold text-slate-200 mb-3">Context</h4>
            <div className="space-y-4">
              <input
                type="text"
                value={culturalContext}
                onChange={(e) => setCulturalContext(e.target.value)}
                placeholder="Cultural context"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
              />
              <input
                type="text"
                value={regionalContext}
                onChange={(e) => setRegionalContext(e.target.value)}
                placeholder="Regional context"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition"
              />
              <textarea
                value={audienceDescription}
                onChange={(e) => setAudienceDescription(e.target.value)}
                placeholder="Target audience description"
                rows={3}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500 transition resize-none"
              />
            </div>
          </div>
        </section>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
