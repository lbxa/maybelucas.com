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

      // Optional: Add loading UI elements
      const loadingElement = document.createElement('div');
      loadingElement.id = 'particle-loading';
      loadingElement.innerHTML = `
        <div style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 100;
          color: #f5f5f5;
          font-family: ui-monospace, monospace;
          text-align: center;
          pointer-events: none;
          background: rgba(18, 18, 18, 0.8);
          backdrop-filter: blur(8px);
          padding: 24px 32px;
          border-radius: 16px;
          border: 1px solid rgba(245, 245, 245, 0.1);
        ">
          <div id="loading-text" style="font-size: 16px; margin-bottom: 12px;">Loading Particles</div>
          <div id="loading-progress" style="font-size: 12px; color: #888;">0%</div>
          <div style="
            width: 200px;
            height: 2px;
            background: rgba(245, 245, 245, 0.1);
            border-radius: 1px;
            margin: 12px auto 0;
            overflow: hidden;
          ">
            <div id="loading-bar" style="
              height: 100%;
              background: #f5f5f5;
              width: 0%;
              transition: width 0.3s ease;
            "></div>
          </div>
        </div>
      `;
      document.body.appendChild(loadingElement);

      const loadingText = document.getElementById('loading-text');
      const loadingProgress = document.getElementById('loading-progress');
      const loadingBar = document.getElementById('loading-bar');

      // Use the stored particle count instead of MIN_PARTICLES
      const initialCount = getParticleCount();
      mobiusSwarm = new MobiusSwarm(canvas, initialCount, {
        onLoadingStart: () => {
          console.log('🌌 Mobius particle system loading started');
          if (loadingElement) loadingElement.style.display = 'block';
        },
        onLoadingProgress: (progress: number) => {
          console.log(`🔄 Loading progress: ${progress}%`);
          if (loadingProgress) loadingProgress.textContent = `${progress}%`;
          if (loadingBar) loadingBar.style.width = `${progress}%`;
        },
        onLoadingComplete: () => {
          console.log('✨ Mobius particle system loaded successfully');
          if (loadingElement) {
            // Small delay to show 100% completion
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