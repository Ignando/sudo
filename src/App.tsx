import { NavLink } from 'react-router-dom'

const categories = [
  { name: 'Graphics Cards', detail: 'Every frame matters', icon: 'gpu' },
  { name: 'Processors', detail: 'Power at the core', icon: 'cpu' },
  { name: 'RAM', detail: 'Keep everything moving', icon: 'ram' },
  { name: 'Monitors', detail: 'See the bigger picture', icon: 'monitor' },
  { name: 'Power Supplies', detail: 'A solid foundation', icon: 'power' },
] as const

type HardwareType = (typeof categories)[number]['icon']

const products: { name: string; category: string; specs: string; price: string; icon: 'gpu' | 'cpu' | 'ram'; label: string }[] = [
  { name: 'Vertex RTX 5080', category: 'Graphics card', specs: '16 GB GDDR7 · Triple-fan cooling', price: '$899', icon: 'gpu', label: 'BUILDER’S PICK' },
  { name: 'Nexus R9 9800X', category: 'Processor', specs: '12 cores · Up to 5.6 GHz', price: '$429', icon: 'cpu', label: 'POWER PLAYER' },
  { name: 'Pulse DDR5 32 GB', category: 'Memory', specs: '2 × 16 GB · 6000 MT/s', price: '$119', icon: 'ram', label: 'SWEET SPOT' },
]

function CategoryIcon({ type }: { type: HardwareType }) {
  const paths: Record<HardwareType, string> = {
    gpu: 'M4 7h17v11H4z M4 10H2V6 M7 18v3h9v-3 M9 10a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5 M16 10a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5',
    cpu: 'M6 6h12v12H6z M9 9h6v6H9z M9 2v4 M15 2v4 M9 18v4 M15 18v4 M2 9h4 M2 15h4 M18 9h4 M18 15h4',
    ram: 'M3 6h18v11H3z M6 9v4 M10 9v4 M14 9v4 M18 9v4 M6 17v3 M10 17v3 M14 17v3 M18 17v3',
    monitor: 'M2 4h20v14H2z M12 18v4 M7 22h10',
    power: 'M3 4h18v16H3z M9 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10 M9 10v4 M7 12h4 M17 8h1 M17 12h1 M17 16h1',
  }

  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[type]} /></svg>
}

function HardwareArt({ type }: { type: 'gpu' | 'cpu' | 'ram' }) {
  return (
    <svg className={`hardware-art hardware-art--${type}`} viewBox="0 0 520 290" aria-hidden="true">
      {type === 'gpu' && <>
        <path d="M45 83 435 58 486 92 95 119Z" fill="#555c51" />
        <path d="m435 58 51 34v132l-51-33Z" fill="#20251f" />
        <path d="M45 83 435 58v133L45 218Z" fill="#32382f" stroke="#727a67" strokeWidth="2" />
        <path d="m55 96 367-24v107L55 204Z" fill="#191d18" />
        <path d="m40 78-12 1v151l12-1 M66 218v12l76-5v-13" fill="none" stroke="#858b7b" strokeWidth="5" />
        <path d="m170 211 152-10v12l-152 10Z" fill="#a2915b" />
        {[119, 246, 373].map((x) => (
          <g key={x} transform={`translate(${x} ${153 - x * 0.064}) skewY(-4)`}>
            <circle r="53" fill="#0e110e" stroke="#555d4e" strokeWidth="3" />
            <circle r="47" fill="none" stroke="#2b3226" />
            {Array.from({ length: 9 }, (_, i) => <path key={i} d="M-5-12C-35-12-39-27-22-43-24-22-2-25 9-10Z" fill="#3c4436" stroke="#59624e" strokeWidth="0.7" transform={`rotate(${i * 40})`} />)}
            <circle r="14" fill="#232920" stroke="#707b60" />
            <path d="m-5-5 7 5-7 5 M3 5h5" fill="none" stroke="#b6d889" strokeWidth="2" />
          </g>
        ))}
        <path d="m447 93 27 18v12l-27-18Z" fill="#c1f17b" />
        <path d="m446 137 28 18m-28-7 28 18m-28-7 28 18" stroke="#525c47" strokeWidth="3" />
      </>}
      {type === 'cpu' && <g transform="translate(260 145) rotate(-16)">
        <rect x="-91" y="-91" width="182" height="182" rx="8" fill="#24362e" stroke="#536e5d" strokeWidth="3" />
        {Array.from({ length: 12 }, (_, i) => <g key={i} stroke="#c0ac6d" strokeWidth="5"><path d={`M${-77 + i * 14} -97v-8 M${-77 + i * 14} 97v8 M-97 ${-77 + i * 14}h-8 M97 ${-77 + i * 14}h8`} /></g>)}
        <rect x="-73" y="-73" width="146" height="146" rx="12" fill="#a1a69b" stroke="#d4d8cb" strokeWidth="3" />
        <rect x="-60" y="-60" width="120" height="120" rx="6" fill="#c4c8bc" />
        <text textAnchor="middle" y="-15" fill="#4c5547" fontSize="14" letterSpacing="5">NEXUS</text>
        <text textAnchor="middle" y="27" fill="#333c2e" fontSize="39" fontWeight="700">R9</text>
        <path d="M-40 43h80" stroke="#7e8874" />
      </g>}
      {type === 'ram' && <g transform="translate(45 65) rotate(-13 210 80)">
        {[0, 85].map((y) => <g key={y} transform={`translate(0 ${y})`}>
          <path d="M15 5h385v62H15Z" fill="#25352b" />
          <path d="M7 0h401v49H7Z" fill="#343d31" stroke="#65725a" strokeWidth="2" />
          <path d="M12 0h391v7H12Z" fill="#c1f17b" />
          {[35, 88, 141, 247, 300, 353].map((x) => <path key={x} d={`M${x} 15v25m8-25v25m8-25v25`} stroke="#1a2218" strokeWidth="4" />)}
          <text x="192" y="32" fill="#c4cdbb" fontSize="13" fontWeight="700" textAnchor="middle">PULSE</text>
          <path d="M28 63h155m17 0h185" stroke="#b6a36b" strokeWidth="9" strokeDasharray="4 2" />
        </g>)}
      </g>}
    </svg>
  )
}

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="site-header container">
        <a className="logo" href="#" aria-label="Sudo home"><span className="logo-mark" aria-hidden="true">&gt;_</span> sudo<span className="logo-dot">.</span></a>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/products">Products</NavLink>
          <a href="#about">About Sudo</a>
        </nav>
        <a className="header-link" href="#featured">Find your next upgrade <span aria-hidden="true">↗</span></a>
      </header>

      <main id="main">
        <section className="hero container" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> FOR THE BUILDERS. THE PLAYERS. THE CREATORS.</p>
            <h1 id="hero-title">Great builds<br />start with <span>sudo.</span></h1>
            <p className="hero-description">Your next idea deserves the right hardware. Discover the components that take your setup further.</p>
            <a className="button" href="#categories">Explore the hardware <span aria-hidden="true">↗</span></a>
            <div className="hero-note"><span aria-hidden="true">⌘</span> More performance. More possibilities.</div>
          </div>
          <div className="hero-visual">
            <div className="visual-topline"><span>THE NEXT LEVEL OF PLAY</span><span>01 / 03</span></div>
            <span className="visual-word" aria-hidden="true">LEVEL UP</span>
            <div className="hero-product"><HardwareArt type="gpu" /></div>
            <div className="visual-caption"><div><span className="eyebrow">MEET YOUR NEXT UPGRADE</span><h2>Vertex RTX 5080</h2><p>Built for the frames you live for.</p></div><a href="#featured" aria-label="Explore featured products" className="round-link">↗</a></div>
            <span className="illustration-note">CONCEPT HARDWARE / ILLUSTRATION</span>
          </div>
        </section>

        <section className="categories-section container" id="categories" aria-labelledby="categories-title">
          <div className="section-heading"><div><p className="eyebrow">YOUR BUILD, YOUR WAY</p><h2 id="categories-title">Find your next upgrade.</h2></div><span className="section-aside">Five essentials. Endless possibilities.</span></div>
          <div className="category-grid">
            {categories.map((category, index) => <article className="category-card" key={category.icon}><div className="category-top"><CategoryIcon type={category.icon} /><span>0{index + 1}</span></div><h3>{category.name}</h3><p>{category.detail}</p></article>)}
          </div>
        </section>

        <section className="featured-section container" id="featured" aria-labelledby="featured-title">
          <div className="section-heading"><div><p className="eyebrow">WORTH A CLOSER LOOK</p><h2 id="featured-title">Small lineup. Big potential.</h2></div><span className="section-aside">A few favorites for your next build.</span></div>
          <div className="product-grid">
            {products.map((product) => <article className="product-card" key={product.name}>
              <div className="product-image"><span className="product-label">{product.label}</span><HardwareArt type={product.icon} /></div>
              <div className="product-info"><p className="eyebrow">{product.category}</p><h3>{product.name}</h3><p className="product-specs">{product.specs}</p><div className="product-price"><strong>{product.price}<span>.00</span></strong><span>USD · Concept product</span></div></div>
            </article>)}
          </div>
          <p className="demo-note">A little inspiration, not a live catalog. Products and prices are fictional.</p>
        </section>

        <section className="about-section container" id="about" aria-labelledby="about-title">
          <div className="about-symbol" aria-hidden="true">&gt;_</div>
          <div><p className="eyebrow">A LITTLE ABOUT SUDO</p><h2 id="about-title">Hardware people.<br />Just like you.</h2></div>
          <div className="about-copy"><p>Sudo is a fictional computer hardware store built around a simple idea: a great setup starts with great components.</p><p>From your first PC to your next big upgrade, we’re here to celebrate the parts, the process, and the possibilities.</p><a href="#categories">Make room for what’s next <span aria-hidden="true">↗</span></a></div>
        </section>
      </main>

      <footer className="site-footer container"><div><a className="logo" href="#" aria-label="Sudo home"><span className="logo-mark" aria-hidden="true">&gt;_</span> sudo<span className="logo-dot">.</span></a><p>Built for what’s next.</p></div><p>© {new Date().getFullYear()} Sudo. A fictional store concept.</p><a className="back-top" href="#">Back to top <span aria-hidden="true">↑</span></a></footer>
    </>
  )
}
