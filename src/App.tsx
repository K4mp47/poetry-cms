import { useState, useEffect, useRef } from "react";
import { ContentType } from "./types";
import type { ContentItem } from "./types";
import { useFirebaseDB } from "./hooks/useFirebaseDB";
import { useAuth } from "./hooks/useAuth";
import CMS from "./components/CMS";
import Login from "./components/Login";
import type { ReactNode, FC } from "react";

const HamburgerButton: FC<{ onClick: () => void; isOpen: boolean }> = ({
  onClick,
  isOpen,
}) => (
  <button
    onClick={onClick}
    className="fixed top-8 right-8 z-50 mix-blend-difference focus:outline-none w-10 h-10 flex flex-col justify-center items-center group"
    aria-label={isOpen ? "Close Menu" : "Open Menu"}
  >
    <div className="relative w-8 h-6">
      <span
        className={`absolute left-0 w-full h-0.5 bg-white transform transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          isOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
        }`}
      />
      <span
        className={`absolute left-0 w-full h-0.5 bg-white top-1/2 -translate-y-1/2 transition-opacity duration-300 ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 w-full h-0.5 bg-white transform transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
          isOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0"
        }`}
      />
    </div>
  </button>
);

const BrandButton: FC<{
  onClick: () => void;
  visible: boolean;
  brandName: string;
}> = ({ onClick, visible, brandName }) => (
  <button
    onClick={onClick}
    className={`fixed top-8 left-8 z-50 mix-blend-difference focus:outline-none transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
    aria-label="Return to Home"
  >
    <h1 className="font-serif text-2xl font-bold text-white tracking-tighter">
      {brandName}.
    </h1>
  </button>
);

interface FadeInItemProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

const FadeInItem: FC<FadeInItemProps> = ({
  children,
  delay = 0,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transform transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
      } ${className}`}
    >
      {children}
    </div>
  );
};

// --- Loading Component ---

const LoadingView: FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-paper">
    <div className="text-center">
      <div className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-6"></div>
      <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted">
        Loading Content...
      </p>
    </div>
  </div>
);

// --- Home View Components ---

interface CardProps {
  item: ContentItem;
  offsetIndex: number;
  onItemClick: (item: ContentItem) => void;
}

const Card: FC<CardProps> = ({ item, offsetIndex, onItemClick }) => (
  <FadeInItem delay={100}>
    <div
      onClick={() => onItemClick(item)}
      className="group cursor-pointer mb-32 md:mb-48 block"
    >
      <div className="flex items-baseline space-x-3 mb-6 border-b border-gray-200 pb-4 transition-colors duration-500">
        <span className="font-sans text-xs font-bold text-accent tracking-widest">
          {`0${offsetIndex + 1}`}
        </span>
        <span className="font-sans text-[10px] uppercase tracking-[0.2em] text-muted">
          {item.type}
        </span>
        <div className="flex-grow"></div>
        <span className="font-sans text-[10px] uppercase tracking-widest text-muted">
          {item.date || "2024"}
        </span>
      </div>
      <h2 className="font-serif text-4xl md:text-6xl mb-6 group-hover:text-accent transition-colors duration-300 leading-[1.1]">
        {item.title}
      </h2>
      <p className="font-sans text-sm md:text-base text-muted leading-loose max-w-sm line-clamp-3">
        {item.excerpt || item.body.substring(0, 150) + "..."}
      </p>
    </div>
  </FadeInItem>
);

// --- Home View ---

interface HomeViewProps {
  items: ContentItem[];
  siteTitle: string;
  siteDescription: string;
  onItemClick: (item: ContentItem) => void;
}

const HomeView: FC<HomeViewProps> = ({
  items,
  siteTitle,
  siteDescription,
  onItemClick,
}) => {
  const rightColRef = useRef<HTMLDivElement>(null);

  const feedItems = items.filter(
    (item) =>
      item.type === ContentType.STORY ||
      item.type === ContentType.POEM ||
      item.type === ContentType.QUOTE,
  );

  const leftColItems = feedItems.filter((_, i) => i % 2 === 0);
  const rightColItems = feedItems.filter((_, i) => i % 2 !== 0);

  useEffect(() => {
    const handleScroll = () => {
      if (rightColRef.current) {
        const offset = window.scrollY * 0.15;
        rightColRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Split title for display
  const titleWords = siteTitle.split(" ");

  return (
    <div className="min-h-screen relative bg-paper overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 pt-32 md:pt-64 pb-32 flex flex-col md:flex-row gap-8 md:gap-32">
        <div className="w-full md:w-1/2 flex flex-col pt-12">
          <div className="mb-24 md:mb-64">
            <h1 className="font-serif text-5xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tighter mb-8 md:mb-12 animate-slide-down">
              {titleWords.map((word, i) => (
                <span key={i}>
                  {word}
                  <br />
                </span>
              ))}
            </h1>
            <p className="font-sans text-xs tracking-[0.3em] uppercase text-muted max-w-xs animate-fade-in delay-300">
              {siteDescription}
            </p>
          </div>
          {leftColItems.map((item, idx) => (
            <Card
              key={item.id}
              item={item}
              offsetIndex={idx * 2}
              onItemClick={onItemClick}
            />
          ))}
        </div>
        <div
          ref={rightColRef}
          className="w-full md:w-1/2 flex flex-col md:will-change-transform pt-0 md:pt-96"
        >
          {rightColItems.map((item, idx) => (
            <Card
              key={item.id}
              item={item}
              offsetIndex={idx * 2 + 1}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Filtered List View ---

interface FilteredListViewProps {
  type: (typeof ContentType)[keyof typeof ContentType];
  items: ContentItem[];
  onItemClick: (item: ContentItem) => void;
}

const FilteredListView: FC<FilteredListViewProps> = ({
  type,
  items,
  onItemClick,
}) => {
  const typeLabel =
    type === ContentType.POEM
      ? "Poetry"
      : type === ContentType.STORY
        ? "Stories"
        : `${type}s`;

  return (
    <div className="min-h-screen pt-32 md:pt-40 pb-32 px-6 md:px-32 max-w-6xl mx-auto opacity-0 animate-fade-in">
      <header className="mb-16 md:mb-32 flex flex-col items-start animate-fade-in-up">
        <span className="font-sans text-xs tracking-[0.2em] text-muted uppercase mb-4">
          Collection
        </span>
        <h1 className="font-serif text-5xl md:text-8xl mb-6 text-dark capitalize tracking-tight">
          {typeLabel}
        </h1>
        <div className="h-0.5 w-24 bg-accent"></div>
      </header>
      <div className="space-y-32">
        {items.map((item, index) => {
          const content = (
            <div
              onClick={() => onItemClick(item)}
              className="group cursor-pointer block hover:pl-4 transition-all duration-500 border-l border-transparent hover:border-gray-200"
            >
              {item.type === ContentType.QUOTE ? (
                <figure className="max-w-4xl">
                  <blockquote className="font-serif text-3xl md:text-5xl leading-tight group-hover:text-gray-600">
                    &ldquo;{item.body}&rdquo;
                  </blockquote>
                </figure>
              ) : (
                <article>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="font-sans text-xs tracking-widest text-accent uppercase font-bold">
                      {index + 1 < 10 ? `0${index + 1}` : index + 1}
                    </span>
                    <span className="h-px w-8 bg-gray-200"></span>
                    <span className="font-sans text-xs tracking-widest text-muted uppercase">
                      {item.date || "2024"}
                    </span>
                  </div>
                  <h2 className="font-serif text-4xl md:text-5xl mb-6 group-hover:text-accent">
                    {item.title}
                  </h2>
                  <p className="font-sans text-muted leading-relaxed max-w-2xl line-clamp-2 mb-6 group-hover:text-dark transition-colors">
                    {item.excerpt}
                  </p>
                  <div className="inline-block overflow-hidden relative">
                    <span className="block font-sans text-xs font-bold tracking-widest uppercase transform group-hover:-translate-y-full transition-transform duration-300">
                      Read Piece
                    </span>
                    <span className="absolute top-full left-0 block font-sans text-xs font-bold tracking-widest uppercase text-accent transform group-hover:-translate-y-full transition-transform duration-300">
                      Read Piece
                    </span>
                  </div>
                </article>
              )}
            </div>
          );
          if (type === ContentType.QUOTE)
            return <div key={item.id}>{content}</div>;
          return (
            <FadeInItem key={item.id} delay={index * 50}>
              {content}
            </FadeInItem>
          );
        })}
      </div>
    </div>
  );
};

// --- Detail View ---

interface DetailViewProps {
  item: ContentItem;
  onBack: () => void;
}

const DetailView: FC<DetailViewProps> = ({ item, onBack }) => {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: item.title || "Digital Silence",
      text: item.excerpt || item.body.substring(0, 100),
      url: window.location.href,
    };

    if (
      navigator.share &&
      navigator.canShare &&
      navigator.canShare(shareData)
    ) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== "AbortError")
          console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-paper animate-slide-down relative z-30">
      <div className="max-w-3xl mx-auto pt-32 px-8 pb-32">
        <div className="flex justify-between items-center mb-12 md:mb-20">
          <button
            onClick={onBack}
            className="group flex items-center space-x-3 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-muted hover:text-dark transition-colors"
          >
            <span className="transform group-hover:-translate-x-1 transition-transform duration-300">
              &larr;
            </span>
            <span>Return</span>
          </button>
          <button
            onClick={handleShare}
            className="text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-muted hover:text-dark transition-colors"
          >
            {shared ? "Link Copied" : "Share"}
          </button>
        </div>
        <article className="animate-fade-in">
          <header
            className="mb-16 text-center animate-slide-down"
            style={{ animationFillMode: "both" }}
          >
            {item.date && (
              <span className="block font-sans text-xs tracking-widest text-accent mb-6 uppercase">
                {item.date}
              </span>
            )}
            {item.title && (
              <h1 className="font-serif text-5xl md:text-7xl leading-none mb-10 text-dark">
                {item.title}
              </h1>
            )}
            <div className="h-px w-24 bg-gray-200 mx-auto"></div>
          </header>
          <div
            className="prose prose-xl prose-p:font-serif prose-p:text-gray-600 prose-p:leading-loose mx-auto first-letter:float-left first-letter:text-7xl first-letter:pr-4 first-letter:font-serif first-letter:text-dark animate-fade-in-up"
            style={{ animationDelay: "0.2s", animationFillMode: "both" }}
          >
            {item.body.split("\n").map((paragraph, idx) => (
              <p key={idx} className="mb-8">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
};

// --- Main App Component ---

type ViewType =
  | "HOME"
  | (typeof ContentType)[keyof typeof ContentType]
  | "CMS"
  | "LOGIN";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>("HOME");
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const {
    items,
    settings,
    isLoading,
    isFirebaseConfigured,
    saveItem,
    deleteItem,
    saveSettings,
  } = useFirebaseDB();
  const { isAuthenticated, login, logout } = useAuth();

  const handleNav = (view: ViewType) => {
    setMenuOpen(false);
    setTimeout(() => {
      setSelectedItem(null);
      if (view === "CMS" && !isAuthenticated) {
        setCurrentView("LOGIN");
      } else {
        setCurrentView(view);
      }
      window.scrollTo(0, 0);
    }, 400);
  };

  const handleItemClick = (item: ContentItem) => {
    setSelectedItem(item);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSelectedItem(null);
    window.scrollTo(0, 0);
  };

  const handleHomeClick = () => {
    if (menuOpen) return;
    setSelectedItem(null);
    setCurrentView("HOME");
    window.scrollTo(0, 0);
  };

  const handleLoginSubmit = async (password: string) => {
    const success = await login(password);
    if (success) {
      setCurrentView("CMS");
    }
    return success;
  };

  const handleLogout = () => {
    logout();
    setCurrentView("HOME");
  };

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <div className="bg-paper min-h-screen relative overflow-x-hidden">
      <BrandButton
        onClick={handleHomeClick}
        visible={!menuOpen}
        brandName={settings.authorName}
      />

      {/* Full Screen Menu */}
      <div
        className={`fixed inset-0 bg-dark z-40 transform transition-transform duration-700 ease-[cubic-bezier(0.87,0,0.13,1)] ${menuOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="h-full w-full max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-center md:justify-between px-8 md:px-24">
          <div
            className={`md:w-1/3 text-center md:text-left transition-all duration-700 delay-300 ${menuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <p className="font-serif italic text-white/70 text-xl md:text-2xl leading-loose mb-6">
              "{settings.authorBio}"
            </p>
            <div className="font-sans text-xs tracking-[0.2em] text-accent uppercase">
              {Array.isArray(settings.authorRoles)
                ? settings.authorRoles.join(" • ")
                : ""}
            </div>
          </div>
          <nav className="flex flex-col items-center md:items-end justify-center space-y-6 mt-16 md:mt-0 text-white/70">
            {[
              { label: "Home", view: "HOME" as const },
              { label: "Stories", view: ContentType.STORY },
              { label: "Poetry", view: ContentType.POEM },
              { label: "Quotes", view: ContentType.QUOTE },
              { label: "CMS", view: "CMS" as const },
            ].map((link, i) => (
              <button
                key={link.label}
                onClick={() => handleNav(link.view)}
                style={{ transitionDelay: `${i * 100 + 200}ms` }}
                className={`font-serif text-5xl md:text-7xl text-paper hover:text-accent transition-all duration-300 transform ${menuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <HamburgerButton
        isOpen={menuOpen}
        onClick={() => setMenuOpen(!menuOpen)}
      />

      <main className="transition-opacity duration-500">
        {selectedItem ? (
          <DetailView item={selectedItem} onBack={handleBack} />
        ) : (
          <>
            {currentView === "HOME" && (
              <HomeView
                items={items}
                siteTitle={settings.siteTitle}
                siteDescription={settings.siteDescription}
                onItemClick={handleItemClick}
              />
            )}
            {currentView === ContentType.STORY && (
              <FilteredListView
                type={ContentType.STORY}
                items={items.filter((i) => i.type === ContentType.STORY)}
                onItemClick={handleItemClick}
              />
            )}
            {currentView === ContentType.POEM && (
              <FilteredListView
                type={ContentType.POEM}
                items={items.filter((i) => i.type === ContentType.POEM)}
                onItemClick={handleItemClick}
              />
            )}
            {currentView === ContentType.QUOTE && (
              <FilteredListView
                type={ContentType.QUOTE}
                items={items.filter((i) => i.type === ContentType.QUOTE)}
                onItemClick={handleItemClick}
              />
            )}
            {currentView === "LOGIN" && <Login onLogin={handleLoginSubmit} />}
            {currentView === "CMS" && isAuthenticated && (
              <CMS
                items={items}
                settings={settings}
                isFirebaseConfigured={isFirebaseConfigured}
                onSaveItem={saveItem}
                onDeleteItem={deleteItem}
                onSaveSettings={saveSettings}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
