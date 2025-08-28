import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { GlassCard, GlassCardContent } from '@/components/glass/GlassCard';
import { Volume2, VolumeX, Play, Pause, Music, Waves } from 'lucide-react';

interface AmbientTrack {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  url?: string; // In a real app, these would be actual audio file URLs
  color: string;
}

const AMBIENT_TRACKS: AmbientTrack[] = [
  {
    id: 'river',
    name: 'River Stream',
    icon: Waves,
    description: 'Gentle flowing water sounds',
    color: 'hsl(var(--accent))'
  },
  {
    id: 'wind',
    name: 'Forest Wind',
    icon: Music,
    description: 'Soft wind through trees',
    color: 'hsl(var(--secondary))'
  }
];

export const AmbientSoundControl = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([0.3]);
  const [selectedTrack, setSelectedTrack] = useState<string>('river');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Initialize Web Audio API context for better control
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Initialize audio context
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }

    // Hide controls on scroll
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      setIsVisible(false);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsVisible(true), 1000);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Update volume
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume[0], audioContextRef.current!.currentTime);
    }
  }, [volume]);

  // Simulate audio playback (in a real app, you'd use actual audio files)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTrackChange = (trackId: string) => {
    setSelectedTrack(trackId);
    if (isPlaying) {
      // In a real app, you'd switch the audio source here
      setCurrentTime(0);
    }
  };

  const currentTrack = AMBIENT_TRACKS.find(track => track.id === selectedTrack) || AMBIENT_TRACKS[0];

  const controlVariants = {
    hidden: { 
      opacity: 0, 
      y: 100,
      scale: 0.8
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      y: 100,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  const expandedVariants = {
    collapsed: { height: "auto", width: "auto" },
    expanded: { 
      height: "auto", 
      width: 320,
      transition: { 
        duration: 0.3,
        ease: "easeInOut" as const
      }
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="fixed bottom-24 left-4 z-40"
      variants={controlVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div
        variants={expandedVariants}
        animate={isExpanded ? "expanded" : "collapsed"}
      >
        <GlassCard 
          variant="floating"
          className="overflow-hidden"
        >
          <GlassCardContent className="p-4">
            <AnimatePresence mode="wait">
              {!isExpanded ? (
                // Collapsed View
                <motion.div
                  key="collapsed"
                  className="flex items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button
                    onClick={togglePlay}
                    className="glass-panel p-3 rounded-full bg-primary/20 text-primary hover:bg-primary/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </motion.button>

                  {isPlaying && (
                    <motion.div
                      className="flex items-center gap-2 text-white/80"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <currentTrack.icon className="h-4 w-4 text-accent" />
                      </motion.div>
                      <span className="text-sm">{currentTrack.name}</span>
                    </motion.div>
                  )}

                  <motion.button
                    onClick={() => setIsExpanded(true)}
                    className="glass-panel p-2 rounded-full hover:bg-white/10 ml-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Volume2 className="h-4 w-4 text-white/60" />
                  </motion.button>
                </motion.div>
              ) : (
                // Expanded View
                <motion.div
                  key="expanded"
                  className="space-y-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="glass-panel p-2 rounded-full bg-primary/20">
                        <Music className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-white font-medium">Ambient Sounds</span>
                    </div>
                    <motion.button
                      onClick={() => setIsExpanded(false)}
                      className="glass-panel p-2 rounded-full hover:bg-white/10"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      ✕
                    </motion.button>
                  </div>

                  {/* Track Selection */}
                  <div className="space-y-2">
                    <span className="text-sm text-white/70">Sound Track</span>
                    <div className="grid grid-cols-2 gap-2">
                      {AMBIENT_TRACKS.map((track) => (
                        <motion.button
                          key={track.id}
                          onClick={() => handleTrackChange(track.id)}
                          className={`
                            glass-panel p-3 rounded-xl text-left transition-all duration-200
                            ${selectedTrack === track.id 
                              ? 'bg-primary/20 border-primary/30' 
                              : 'hover:bg-white/5'
                            }
                          `}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <track.icon 
                              className={`h-4 w-4 ${selectedTrack === track.id ? 'text-primary' : 'text-white/60'}`}
                            />
                            <span className="text-sm font-medium text-white">{track.name}</span>
                          </div>
                          <p className="text-xs text-white/60">{track.description}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Playback Controls */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <motion.button
                        onClick={togglePlay}
                        className="glass-panel p-3 rounded-full bg-primary/20 text-primary hover:bg-primary/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </motion.button>

                      {isPlaying && (
                        <motion.div
                          className="text-center"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <div className="text-sm text-white/80">Playing</div>
                          <div className="text-xs text-white/60">
                            {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
                          </div>
                        </motion.div>
                      )}

                      <div className="flex items-center gap-2">
                        {volume[0] === 0 ? (
                          <VolumeX className="h-4 w-4 text-white/60" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-white/60" />
                        )}
                      </div>
                    </div>

                    {/* Volume Control */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white/70">Volume</span>
                        <span className="text-sm text-white/60">{Math.round(volume[0] * 100)}%</span>
                      </div>
                      <Slider
                        value={volume}
                        onValueChange={setVolume}
                        max={1}
                        step={0.01}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Visual Indicator */}
                  {isPlaying && (
                    <motion.div
                      className="glass-panel p-3 rounded-xl bg-primary/10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 10, -10, 0]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <currentTrack.icon className="h-5 w-5 text-accent" />
                        </motion.div>
                        <div className="flex-1">
                          <div className="text-sm text-white">{currentTrack.name}</div>
                          <div className="text-xs text-white/60">{currentTrack.description}</div>
                        </div>
                        <div className="flex gap-1">
                          {[...Array(4)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 bg-primary rounded-full"
                              animate={{ 
                                height: [4, 12, 4],
                                opacity: [0.3, 1, 0.3]
                              }}
                              transition={{ 
                                duration: 1, 
                                repeat: Infinity,
                                delay: i * 0.1
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCardContent>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};