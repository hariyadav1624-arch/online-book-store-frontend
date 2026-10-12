import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "/api/books";
const PAGE_SIZE = 6;
const EMPTY_BOOK = {
  title: "",
  author: "",
  price: "",
  stock: "",
  description: "",
};

async function readError(response) {
  const text = await response.text();

  if (!text) {
    return `Request failed (${response.status}).`;
  }

  try {
    const body = JSON.parse(text);
    if (typeof body.message === "string") {
      return body.message;
    }
    if (typeof body.error === "string") {
      return body.error;
    }
    if (body.errors && typeof body.errors === "object") {
      return Object.values(body.errors).join(" ");
    }
  } catch {
    return text;
  }

  return text;
}

function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalBooks, setTotalBooks] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState({ term: "", field: "title" });
  const [sortBy, setSortBy] = useState("id");
  const [direction, setDirection] = useState("asc");
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingBook, setEditingBook] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadBooks() {
      setLoading(true);
      setError("");

      try {
        if (search.term) {
          const response = await fetch(
            `${API_URL}/search/${search.field}?${search.field}=${encodeURIComponent(search.term)}`,
            { signal: controller.signal },
          );
          if (!response.ok) {
            throw new Error(await readError(response));
          }

          const results = await response.json();
          const sorted = [...results].sort((left, right) =>
            compareBooks(left, right, sortBy, direction),
          );
          const pages = Math.ceil(sorted.length / PAGE_SIZE);
          setTotalBooks(sorted.length);
          setTotalPages(pages);
          setBooks(sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE));
          return;
        }

        const parameters = new URLSearchParams({
          page: String(page),
          size: String(PAGE_SIZE),
          sortBy,
          direction,
        });
        const response = await fetch(`${API_URL}/page?${parameters}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(await readError(response));
        }

        const result = await response.json();
        setBooks(result.content);
        setTotalPages(result.totalPages);
        setTotalBooks(result.totalElements);
      } catch (loadError) {
        if (loadError.name !== "AbortError") {
          setError(loadError.message || "Could not load books.");
          setBooks([]);
          setTotalPages(0);
          setTotalBooks(0);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadBooks();
    return () => controller.abort();
  }, [direction, page, refreshKey, search, sortBy]);

  function submitSearch(event) {
    event.preventDefault();
    setPage(0);
    setSearch({ term: searchInput.trim(), field: search.field });
  }

  function clearSearch() {
    setSearchInput("");
    setSearch({ term: "", field: "title" });
    setPage(0);
  }

  function changeSort(field, order) {
    setSortBy(field);
    setDirection(order);
    setPage(0);
  }

  async function deleteBook(book) {
    if (!window.confirm(`Delete "${book.title}" from the collection?`)) {
      return;
    }

    setError("");
    try {
      const response = await fetch(`${API_URL}/${book.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }

      if (books.length === 1 && page > 0) {
        setPage((currentPage) => currentPage - 1);
      } else {
        setRefreshKey((key) => key + 1);
      }
    } catch (deleteError) {
      setError(deleteError.message || "Could not delete this book.");
    }
  }

  function saveBook() {
    setEditingBook(null);
    setPage(0);
    setRefreshKey((key) => key + 1);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="BookNest home">
          <span className="brand-mark" aria-hidden="true">B</span>
          <span>book<span className="brand-accent">nest</span></span>
        </a>
        <nav className="top-nav" aria-label="Main navigation">
          <a className="active" href="#collection">Discover</a>
          <a href="#about">Our story</a>
        </nav>
        <a className="nav-cta" href="#collection">Browse collection <span aria-hidden="true">↗</span></a>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span /> YOUR NEXT CHAPTER STARTS HERE</p>
            <h1>Stories worth<br />staying <em>up for.</em></h1>
            <p className="hero-description">
              A thoughtfully gathered collection for curious minds and late-night readers.
              Find the book you didn&apos;t know you needed.
            </p>
            <a className="primary-link" href="#collection">Explore the collection <span aria-hidden="true">↓</span></a>
            <div className="hero-note">
              <div className="reader-avatars" aria-hidden="true"><span>J</span><span>M</span><span>A</span></div>
              <p><strong>Good books, good company.</strong><br />A little corner for every kind of reader.</p>
            </div>
          </div>
          <div className="hero-art" aria-label="A stack of books beside a reading chair">
            <div className="art-sun" />
            <div className="plant plant-one" />
            <div className="plant plant-two" />
            <div className="art-caption"><span>01 / 03</span><span>THE READING ROOM</span></div>
            <div className="book-stack" aria-hidden="true">
              <div className="stack-book book-one"><span>THE ART OF SLOW LIVING</span></div>
              <div className="stack-book book-two"><span>somewhere, someday</span></div>
              <div className="stack-book book-three"><span>WILD&nbsp; / &nbsp;HEART</span></div>
            </div>
            <div className="art-side-note">A good book<br />is a quiet<br />kind of magic.</div>
          </div>
        </section>

        <section className="collection-section" id="collection">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE BOOKSHELF</p>
              <h2>Find your next <em>favorite.</em></h2>
            </div>
            <p className="collection-count">{totalBooks} {totalBooks === 1 ? "book" : "books"} to explore <span>✳</span></p>
          </div>

          <form className="toolbar" onSubmit={submitSearch}>
            <div className="search-box">
              <span className="search-icon" aria-hidden="true">⌕</span>
              <input
                aria-label="Search books"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search a title or author..."
              />
              <select
                aria-label="Search by"
                value={search.field}
                onChange={(event) => setSearch((current) => ({ ...current, field: event.target.value }))}
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
              </select>
              <button className="search-button" type="submit">Search</button>
            </div>
            <div className="sort-controls">
              <label htmlFor="sortBy">Sort</label>
              <select id="sortBy" value={sortBy} onChange={(event) => changeSort(event.target.value, direction)}>
                <option value="id">Featured</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="price">Price</option>
                <option value="stock">Availability</option>
              </select>
              <select aria-label="Sort direction" value={direction} onChange={(event) => changeSort(sortBy, event.target.value)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
              <button className="add-book-button" type="button" onClick={() => setEditingBook({ ...EMPTY_BOOK })}>
                <span aria-hidden="true">＋</span> Add a book
              </button>
            </div>
          </form>

          {search.term && (
            <div className="search-summary">
              Showing results for <strong>&ldquo;{search.term}&rdquo;</strong>
              <button type="button" onClick={clearSearch}>Clear search <span aria-hidden="true">×</span></button>
            </div>
          )}

          {error && <div className="error-banner" role="alert">{error}</div>}
          {loading ? (
            <div className="loading-state" role="status"><span className="spinner" /> Finding your next read...</div>
          ) : books.length > 0 ? (
            <div className="book-grid">
              {books.map((book, index) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={index}
                  onEdit={() => setEditingBook({ ...book })}
                  onDelete={() => deleteBook(book)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">✳</span>
              <h3>{error ? "The shelf is out of reach" : "A little room on the shelf"}</h3>
              <p>{error ? "Check that the bookstore server is running, then try again." : "No books match just yet. Try another search or add a new favorite."}</p>
              {!error && <button type="button" className="text-button" onClick={() => setEditingBook({ ...EMPTY_BOOK })}>Add the first book <span aria-hidden="true">↗</span></button>}
            </div>
          )}

          {!loading && totalPages > 0 && (
            <div className="pagination">
              <span className="page-summary">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalBooks)} of {totalBooks}
              </span>
              <div className="page-actions">
                <button type="button" onClick={() => setPage((current) => current - 1)} disabled={page === 0} aria-label="Previous page">←</button>
                <span>Page <strong>{page + 1}</strong> of {totalPages}</span>
                <button type="button" onClick={() => setPage((current) => current + 1)} disabled={page >= totalPages - 1} aria-label="Next page">→</button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="footer" id="about">
        <a className="brand footer-brand" href="#home"><span className="brand-mark" aria-hidden="true">B</span><span>book<span className="brand-accent">nest</span></span></a>
        <p>Made for the love of getting lost in a story.</p>
        <span>© {new Date().getFullYear()} BookNest</span>
      </footer>

      {editingBook && (
        <BookForm
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSaved={saveBook}
        />
      )}
    </div>
  );
}

function compareBooks(left, right, field, direction) {
  let comparison;
  if (["id", "price", "stock"].includes(field)) {
    comparison = Number(left[field] ?? 0) - Number(right[field] ?? 0);
  } else {
    comparison = String(left[field] ?? "").localeCompare(String(right[field] ?? ""), undefined, {
      sensitivity: "base",
    });
  }
  return direction === "desc" ? -comparison : comparison;
}

function BookCard({ book, index, onEdit, onDelete }) {
  const coverThemes = ["cover-olive", "cover-rose", "cover-blue", "cover-gold", "cover-plum", "cover-sage"];
  const initials = book.title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <article className="book-card">
      <div className={`book-cover ${coverThemes[index % coverThemes.length]}`}>
        <span className="cover-kicker">BOOKNEST EDITION</span>
        <span className="cover-monogram">{initials || "B"}</span>
        <span className="cover-title">{book.title}</span>
        <span className="cover-author">{book.author}</span>
        <span className="cover-spine" aria-hidden="true" />
      </div>
      <div className="book-details">
        <div className="book-title-row">
          <div>
            <p className="book-category">A GOOD READ</p>
            <h3>{book.title}</h3>
          </div>
          <span className="book-price">{formatPrice(book.price)}</span>
        </div>
        <p className="book-author">by {book.author}</p>
        <p className="book-description">{book.description || "A new story waiting to be discovered."}</p>
        <div className="book-card-bottom">
          <span className={`stock-label ${Number(book.stock) > 0 ? "in-stock" : "out-of-stock"}`}>
            <span /> {Number(book.stock) > 0 ? `${book.stock} in stock` : "Out of stock"}
          </span>
          <div className="card-actions">
            <button type="button" onClick={onEdit} aria-label={`Edit ${book.title}`}>Edit</button>
            <button type="button" onClick={onDelete} aria-label={`Delete ${book.title}`}>Delete</button>
          </div>
        </div>
      </div>
    </article>
  );
}

function BookForm({ book, onClose, onSaved }) {
  const isEditing = Boolean(book.id);
  const [form, setForm] = useState({
    title: book.title || "",
    author: book.author || "",
    price: book.price ?? "",
    stock: book.stock ?? "",
    description: book.description || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await fetch(isEditing ? `${API_URL}/${book.id}` : API_URL, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      onSaved();
    } catch (saveError) {
      setError(saveError.message || "Could not save this book.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="book-modal" role="dialog" aria-modal="true" aria-labelledby="book-form-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{isEditing ? "UPDATE THE BOOKSHELF" : "GROW THE BOOKSHELF"}</p>
            <h2 id="book-form-title">{isEditing ? "Edit this book" : "Add a new book"}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">×</button>
        </div>
        <form className="book-form" onSubmit={submit}>
          <label>
            Book title
            <input name="title" value={form.title} onChange={updateField} maxLength="150" required />
          </label>
          <label>
            Author
            <input name="author" value={form.author} onChange={updateField} maxLength="100" required />
          </label>
          <div className="form-row">
            <label>
              Price (₹)
              <input name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={updateField} required />
            </label>
            <label>
              Stock
              <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateField} required />
            </label>
          </div>
          <label>
            Description <span className="optional-label">Optional</span>
            <textarea name="description" value={form.description} onChange={updateField} maxLength="1000" rows="4" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="add-book-button" disabled={saving}>
              {saving ? "Saving..." : isEditing ? "Save changes" : "Add to collection"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function formatPrice(price) {
  const amount = Number(price);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)
    : "Price unavailable";
}

export default App;
