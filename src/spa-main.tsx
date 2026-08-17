import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Toaster } from "sonner";
import { AppErrorComponent } from "@/lib/error-component";
import { Route as IndexRouteImport } from "@/routes/index";
import { Route as DrillsRouteImport } from "@/routes/drills";
import { Route as LoginRouteImport } from "@/routes/login";
import { Route as ProgramRouteImport } from "@/routes/program";
import { Route as TrackerRouteImport } from "@/routes/tracker";
import { Route as VideosRouteImport } from "@/routes/videos";
import { Route as DrillsDrillIdRouteImport } from "@/routes/drills.$drillId";
import { Route as SessionSessionIdRouteImport } from "@/routes/session.$sessionId";
import "./styles.css";

const spaRoot = createRootRoute({
  component: function SpaRoot() {
    return (
      <>
        <Outlet />
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              color: "var(--color-fg)",
              border: "1px solid var(--color-line)",
            },
          }}
        />
      </>
    );
  },
});

const indexRoute = createRoute({
  getParentRoute: () => spaRoot,
  path: "/",
  component: IndexRouteImport.options.component,
});

const drillsRoute = createRoute({
  getParentRoute: () => spaRoot,
  path: "drills",
  component: DrillsRouteImport.options.component,
});

const drillsDrillIdRoute = createRoute({
  getParentRoute: () => drillsRoute,
  path: "$drillId",
  component: DrillsDrillIdRouteImport.options.component,
});

const loginRoute = createRoute({
  getParentRoute: () => spaRoot,
  path: "login",
  component: LoginRouteImport.options.component,
});

const programRoute = createRoute({
  getParentRoute: () => spaRoot,
  path: "program",
  component: ProgramRouteImport.options.component,
});

const trackerRoute = createRoute({
  getParentRoute: () => spaRoot,
  path: "tracker",
  component: TrackerRouteImport.options.component,
});

const videosRoute = createRoute({
  getParentRoute: () => spaRoot,
  path: "videos",
  component: VideosRouteImport.options.component,
});

const sessionRoute = createRoute({
  getParentRoute: () => spaRoot,
  path: "session/$sessionId",
  component: SessionSessionIdRouteImport.options.component,
});

const routeTree = spaRoot.addChildren([
  indexRoute,
  drillsRoute.addChildren([drillsDrillIdRoute]),
  loginRoute,
  programRoute,
  trackerRoute,
  videosRoute,
  sessionRoute,
]);

const router = createRouter({
  routeTree,
  basepath: "/Soccer-Activate",
  defaultErrorComponent: AppErrorComponent,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("#root missing");

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
