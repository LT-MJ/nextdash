# Blog CMS

## Admin

- `/admin/blog` — dashboard (post counts by status, categories/tags/authors
  totals, average SEO score, posts missing SEO metadata, most-viewed/
  recently-published/recently-updated), all server-aggregated.
- `/admin/blog/posts` — server-paginated, filterable (status, category,
  author, search) list with SEO score badges and bulk status-change.
- `/admin/blog/posts/new` / `/admin/blog/posts/[id]` — tabbed editor:
  - **Content**: title, slug (auto-suggested via `slugify()`, editable),
    excerpt, featured image URL, category, tag picker, author, status
    (DRAFT/REVIEW/SCHEDULED/PUBLISHED/ARCHIVED), publish/schedule dates,
    comments/featured flags, and a dependency-free content editor
    (`src/components/admin/blog/ContentEditor.tsx`) — a toolbar that wraps
    the current textarea selection in HTML tags (bold, italic, H2/H3, link,
    blockquote, lists, image, code) plus a raw-HTML preview toggle. No rich
    text library was added; this is a deliberate, pragmatic choice — see
    [scope-and-limitations.md](./scope-and-limitations.md).
  - **SEO**: embeds the shared `<SeoEditorPanel entityType="post" ... />`
    (only after the post has been saved once, since it needs a real
    `entityId`).
  - **Revisions**: every save writes a `BlogPostRevision` snapshot *before*
    applying the update; the panel lists them with a confirm-then-restore
    action.
  - Publishing for the first time sets `publishedAt`; reading time is
    recomputed from word count on every save.
  - **Slug-change redirects** (spec §31): if a published post's slug
    changes, a dialog offers to create a 301 redirect from the old path to
    the new one — via the existing `/api/admin/seo/redirects` endpoint, not
    a separate redirect mechanism.
- `/admin/blog/categories`, `/tags`, `/authors` — dialog-based CRUD, with
  parent-category cycle protection and unused-tag flagging.

## Public

`/blog` (paginated, featured post, category filter chips, title search),
`/blog/[slug]` (full article, breadcrumbs + Article/BlogPosting +
BreadcrumbList JSON-LD via the shared schema generators, related posts,
share links, view-count increment), `/blog/category/[slug]`,
`/blog/tag/[slug]`, `/blog/author/[slug]` (with Person schema). All use
`resolvePageMetadata()` for `generateMetadata()`.

## Related posts

`src/lib/blog/related-posts.ts` checks manual `BlogPostRelation` rows
first, falls back to same-category most-recent, then falls back to
most-recent overall — never an empty related-posts section if any other
published post exists.

## Deliberately out of scope for this build

- No UI for `BlogPost.gallery` (only the single `featuredImage` field has
  an editor — the spec's UI requirements only called out the featured
  image explicitly).
- No admin UI to hand-author `BlogPostRelation` rows — only the read-side
  fallback chain above.
- No comment-moderation UI (`BlogComment` exists in the schema with a
  `commentsEnabled` toggle on the post, but no public submission form or
  admin moderation queue).
- Public blog search matches post titles only, not full body content.
