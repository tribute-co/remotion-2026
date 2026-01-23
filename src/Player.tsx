import { Player } from '@remotion/player';
import { VideoSequence } from './VideoSequence';

export const PlayerDemo: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#1a1a1a',
      padding: '2rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h1 style={{ 
        color: '#fff', 
        marginBottom: '2rem',
        fontSize: '2.5rem',
        fontWeight: 'bold'
      }}>
        Remotion Player Demo
      </h1>
      
      <div style={{
        maxWidth: '1280px',
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <Player
          component={VideoSequence}
          durationInFrames={900}
          fps={30}
          compositionWidth={1920}
          compositionHeight={1080}
          style={{
            width: '100%',
            height: '100%',
          }}
          controls
          loop
        />
      </div>

      <div style={{ 
        color: '#888', 
        marginTop: '2rem',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <p style={{ marginBottom: '1rem' }}>
          Playing 3 videos in sequence:
        </p>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <li>🦥 Sloth on Train</li>
          <li>🐴 Mongolian Horses 4K</li>
          <li>✨ Magical Ink</li>
        </ul>
      </div>
    </div>
  );
};
