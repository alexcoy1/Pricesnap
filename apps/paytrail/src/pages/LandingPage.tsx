import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <Logo size="md" variant="dark" href="/" tagline="Commission software" />
        <nav className="landing-nav">
          <a href="#audience">Who it&apos;s for</a>
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link to="/signup" className="btn btn-primary btn-sm">Create account</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="hero-eyebrow">For salespeople and business owners</p>
          <h1>Commission from any invoice.<br />Matched to your price list.</h1>
          <p className="hero-lead">
            PayTrail imports quotes and invoices, matches each line to your catalog, and
            calculates commission automatically. Reps can confirm their payout after a close.
            Owners can process commissions for their team without rebuilding spreadsheets every
            time.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-primary btn-lg">Create account</Link>
            <Link to="/login" className="btn btn-ghost btn-lg">Log in</Link>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-row">
            <span className="hero-card-label">Commission summary</span>
            <span className="hero-card-badge">3 lines matched</span>
          </div>
          <div className="hero-card-line">
            <span>Ocean Signature 7&apos;</span>
            <strong>$1,240.00</strong>
          </div>
          <div className="hero-card-line">
            <span>Cover + lifter</span>
            <strong>$380.00</strong>
          </div>
          <div className="hero-card-total">
            <span>Total commission</span>
            <strong>$405.00</strong>
          </div>
          <p className="hero-card-foot">Based on your price list and commission rate</p>
        </div>
      </section>

      <section id="audience" className="landing-section landing-section-alt">
        <h2>Who it&apos;s for</h2>
        <p className="section-lead">
          PayTrail is built for anyone who needs accurate commission numbers when a deal is done.
        </p>
        <div className="audience-grid">
          <article className="audience-card">
            <h3>Salespeople</h3>
            <p>
              Upload an invoice after the close and see exactly what you earned. Clear
              line-item detail, no manual math, and a record you can refer back to.
            </p>
          </article>
          <article className="audience-card">
            <h3>Business owners</h3>
            <p>
              Calculate rep commissions from the invoices they submit. PayTrail handles the
              matching and math so you can pay your team with confidence and keep a clean
              payout history.
            </p>
          </article>
        </div>
      </section>

      <section id="features" className="landing-section">
        <h2>What you get</h2>
        <p className="section-lead">
          A straightforward workflow from invoice to commission — fast enough to use on every deal.
        </p>
        <div className="feature-grid">
          <article className="feature-card feature-card-highlight">
            <h3>Automatic calculation</h3>
            <p>
              Set your commission rate once. PayTrail applies it to matched line items and
              shows margin, sell price, and payout in one view.
            </p>
          </article>
          <article className="feature-card">
            <h3>Invoice import</h3>
            <p>
              Upload a PDF, photo, or spreadsheet. PayTrail reads the document and extracts
              products, quantities, and prices — no retyping required.
            </p>
          </article>
          <article className="feature-card">
            <h3>Price list management</h3>
            <p>
              Store one or more catalogs with item, sell, and cost pricing. Reuse them across
              deals and update when your list changes.
            </p>
          </article>
          <article className="feature-card">
            <h3>History and reporting</h3>
            <p>
              Every calculation is saved. Review past payouts, track totals by month, and see
              which customers or reps each run belongs to.
            </p>
          </article>
        </div>
      </section>

      <section id="how" className="landing-section landing-section-alt">
        <h2>How it works</h2>
        <ol className="steps-list">
          <li><strong>Add your price list</strong> — upload your catalog with item, price, and cost.</li>
          <li><strong>Upload the invoice</strong> — from a closed deal, as a PDF, image, or file.</li>
          <li><strong>Review the commission</strong> — matched lines, totals, and a saved record.</li>
        </ol>
      </section>

      <section className="landing-cta">
        <h2>Replace the spreadsheet.</h2>
        <p>Create a free account — saved in your browser, no setup required.</p>
        <Link to="/signup" className="btn btn-primary btn-lg">Create account</Link>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} PayTrail</span>
        <span>Commission software for salespeople and business owners</span>
      </footer>
    </div>
  );
}
