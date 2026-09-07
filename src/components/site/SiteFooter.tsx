import Link from "next/link";
import { resolveSiteChrome } from "@/lib/site/chrome-render";

export async function SiteFooter() {
  const chrome = await resolveSiteChrome();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {chrome.footerColumns.length > 0 ? (
          <div className="mb-8 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {chrome.footerColumns.map((column) => (
              <div key={column.heading} className="space-y-2">
                <h3 className="text-sm font-semibold">{column.heading}</h3>
                <ul className="space-y-1">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
        {chrome.socialLinks.length > 0 ? (
          <div className="mb-4 flex gap-4">
            {chrome.socialLinks.map((social) => (
              <a key={social.platform} href={social.url} className="text-sm text-muted-foreground hover:text-foreground">
                {social.platform}
              </a>
            ))}
          </div>
        ) : null}
        <p className="text-center text-sm text-muted-foreground">{chrome.copyrightText}</p>
      </div>
    </footer>
  );
}
