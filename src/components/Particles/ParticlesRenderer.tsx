import { onMount, onCleanup } from 'solid-js';
import { MobiusSwarm } from './MobiusSwarm';
import { $C } from '@/utils';
import { particleCount, getParticleCount } from '@/stores/particleStore';

let mobiusSwarm: MobiusSwarm | null = null;

export const ParticlesRenderer = () => {
  onMount(() => {
    // Only run on the client
    if (typeof document !== 'undefined') {
      initializeParticles();
      
      // Reinitialize on ViewTransitions
      document.addEventListener('astro:page-load', initializeParticles);
      
      // Listen to particle count changes from the store
      const unsubscribe = particleCount.subscribe((newCount) => {
        if (mobiusSwarm) {
          mobiusSwarm.updateParticleCount(newCount);
        }
      });
      
      // Clean up subscription
      onCleanup(() => {
        unsubscribe();
      });
    }
  });

  onCleanup(() => {
    if (mobiusSwarm) {
      mobiusSwarm.dispose();
      mobiusSwarm = null;
    }
    // Only remove event listener if we're in the browser
    if (typeof document !== 'undefined') {
      document.removeEventListener('astro:page-load', initializeParticles);
    }
  });

  function initializeParticles() {
    // Only run in the browser
    if (typeof document === 'undefined') return;
    
    // Clean up previous instance if it exists
    if (mobiusSwarm) {
      mobiusSwarm.dispose();
      mobiusSwarm = null;
    }

    const canvas = document.querySelector("#webgl") as HTMLCanvasElement;
    if (canvas) {
      // Remove any existing loading elements
      const existingLoading = document.getElementById('particle-loading');
      if (existingLoading) {
        existingLoading.remove();
      }

      const isDark = document.documentElement.classList.contains('dark');
      const barColor = isDark ? '#f5f5f5' : '#1d4ed8';

      const loadingElement = document.createElement('div');
      loadingElement.id = 'particle-loading';
      loadingElement.innerHTML = `
        <div id="loading-bar" style="
          position: fixed;
          top: 0;
          left: 0;
          width: 0%;
          height: 1px;
          background: ${barColor};
          z-index: 100;
          pointer-events: none;
          transition: width 0.3s ease;
        "></div>
      `;
      document.body.appendChild(loadingElement);

      const loadingBar = document.getElementById('loading-bar');

      // Use the stored particle count instead of MIN_PARTICLES
      const initialCount = getParticleCount();
      mobiusSwarm = new MobiusSwarm(canvas, initialCount, {
        onLoadingStart: () => {
          if (loadingElement) loadingElement.style.display = 'block';
        },
        onLoadingProgress: (progress: number) => {
          if (loadingBar) loadingBar.style.width = `${progress}%`;
        },
        onLoadingComplete: () => {
          if (loadingElement) {
            setTimeout(() => {
              loadingElement.style.opacity = '0';
              loadingElement.style.transition = 'opacity 0.5s ease-out';
              setTimeout(() => {
                loadingElement.remove();
              }, 500);
            }, 300);
          }
        }
      });
    }
  }

  return null; // This component doesn't render anything visible
}; 