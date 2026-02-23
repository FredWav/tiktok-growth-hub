

## Scroll to top on navigation

When clicking a link and navigating to a new page, the browser stays at the current scroll position instead of scrolling to the top. This is a common issue with React Router.

### Solution

Create a `ScrollToTop` component that listens for route changes and scrolls the window to the top automatically. Then add it to the app's router.

### Technical details

1. **Create `src/components/ScrollToTop.tsx`** - A small component using `useEffect` + `useLocation` from react-router-dom that calls `window.scrollTo(0, 0)` on every pathname change.

2. **Update `src/App.tsx`** - Add `<ScrollToTop />` inside the `<BrowserRouter>` so it triggers on every navigation.

This is a standard React Router pattern -- no dependencies needed, and it applies globally to all route transitions.

