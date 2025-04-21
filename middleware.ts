import { NextResponse, NextRequest } from "next/server";
import { verifyToken } from "./src/lib/joseToken";
import { getServerSession } from "next-auth";
import { authOptions } from "./src/lib/authOptions"; // Asegúrate de que la ruta sea correcta

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obtener el token JOSE del encabezado Authorization
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");

  // Obtener la sesión de NextAuth
  const session = await getServerSession(authOptions);

  // Verificar autenticación
  let isAuthenticated = false;
  let userId: string | null = null;

  // 1. Verificar token JOSE
  if (token) {
    try {
      const verifiedToken = await verifyToken(token);
      userId = session.user.id as string;
      if (userId) {
        isAuthenticated = true;
      }
    } catch (error) {
      console.error("Error verificando token JOSE:", error);
    }
  }

  // 2. Verificar sesión de NextAuth
  if (session && session.user && session.user.id) {
    userId = session.user.id;
    isAuthenticated = true;
  }

  // Definir rutas públicas y protegidas
  const publicPaths = ["/auth/register", "/auth/signin"];
  const protectedPaths = ["/me"];
  const isPublicPath = publicPaths.includes(pathname);
  const isProtectedPath = protectedPaths.includes(pathname);

  // Redirigir si está autenticado y accede a una ruta pública
  if (isAuthenticated && isPublicPath) {
    console.log(`Usuario autenticado (${userId}) intentó acceder a ${pathname}, redirigiendo a /me`);
    return NextResponse.redirect(new URL("/me", request.url));
  }

  // Redirigir si no está autenticado y accede a una ruta protegida
  if (!isAuthenticated && isProtectedPath) {
    console.log(`Usuario no autenticado intentó acceder a ${pathname}, redirigiendo a /auth/register`);
    return NextResponse.redirect(new URL("/auth/register", request.url));
  }

  // Si está autenticado, agregar el userId al header para rutas API
  if (isAuthenticated && pathname.startsWith("/api/me")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", userId as string);
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Continuar con la solicitud si no hay redirección
  return NextResponse.next();
}

// Configuración para aplicar el middleware a rutas específicas
export const config = {
  matcher: ["/auth/register", "/auth/signin", "/me", "/api/me/:path*"],
};