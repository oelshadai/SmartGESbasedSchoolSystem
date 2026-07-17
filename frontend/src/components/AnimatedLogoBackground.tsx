import { useEffect, useRef } from 'react';

interface Logo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}

const AnimatedLogoBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logosRef = useRef<Logo[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize 3 logos with random positions and velocities
    const initLogos = () => {
      const containerRect = container.getBoundingClientRect();
      const logoSize = 150; // Larger size for better visibility
      
      logosRef.current = Array.from({ length: 3 }, (_, i) => ({
        x: Math.random() * (containerRect.width - logoSize),
        y: Math.random() * (containerRect.height - logoSize),
        vx: (Math.random() - 0.5) * 1.5, // Slightly slower for smoother animation
        vy: (Math.random() - 0.5) * 1.5,
        size: logoSize,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 1.5, // Slower rotation
      }));
    };

    // Animation loop
    const animate = () => {
      const containerRect = container.getBoundingClientRect();
      
      logosRef.current.forEach((logo, index) => {
        // Update position
        logo.x += logo.vx;
        logo.y += logo.vy;
        logo.rotation += logo.rotationSpeed;

        // Bounce off walls
        if (logo.x <= 0 || logo.x >= containerRect.width - logo.size) {
          logo.vx *= -1;
          logo.x = Math.max(0, Math.min(containerRect.width - logo.size, logo.x));
        }
        if (logo.y <= 0 || logo.y >= containerRect.height - logo.size) {
          logo.vy *= -1;
          logo.y = Math.max(0, Math.min(containerRect.height - logo.size, logo.y));
        }

        // Check collision with other logos
        logosRef.current.forEach((otherLogo, otherIndex) => {
          if (index !== otherIndex) {
            const dx = logo.x - otherLogo.x;
            const dy = logo.y - otherLogo.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < logo.size * 0.8) { // Collision detected
              // Simple collision response - reverse velocities
              const tempVx = logo.vx;
              const tempVy = logo.vy;
              logo.vx = otherLogo.vx;
              logo.vy = otherLogo.vy;
              otherLogo.vx = tempVx;
              otherLogo.vy = tempVy;
              
              // Separate logos to prevent sticking
              const angle = Math.atan2(dy, dx);
              const targetX = otherLogo.x + Math.cos(angle) * logo.size;
              const targetY = otherLogo.y + Math.sin(angle) * logo.size;
              logo.x = targetX;
              logo.y = targetY;
            }
          }
        });

        // Update DOM element
        const logoElement = container.children[index] as HTMLElement;
        if (logoElement) {
          logoElement.style.transform = `translate(${logo.x}px, ${logo.y}px) rotate(${logo.rotation}deg)`;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initialize and start animation
    initLogos();
    animate();

    // Handle resize
    const handleResize = () => {
      initLogos();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      {/* 3 animated logos with enhanced visibility */}
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="absolute"
          style={{
            width: '150px',
            height: '150px',
            willChange: 'transform',
          }}
        >
          <img
            src="/EliteTech logo with 3D cube design.png"
            alt=""
            className="w-full h-full object-contain"
            style={{
              opacity: 0.45,
              filter: 'drop-shadow(0 0 15px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 30px rgba(59, 130, 246, 0.4)) brightness(1.2) contrast(1.1)',
            }}
          />
          {/* Glow pulse overlay */}
          <div 
            className="absolute inset-0 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
              animationDuration: `${2 + index * 0.5}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default AnimatedLogoBackground;