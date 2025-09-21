export default defineNuxtRouteMiddleware(async (_to, _from) => {
  // Côté client, vérifier l'utilisateur et ses droits admin
  if (_to.path.startsWith("/login")) return;
  if (import.meta.client) {
    const user = useSupabaseUser();
    const userStore = useUserStore();

    if (!user.value) {
      return navigateTo("/login");
    }

    // Attendre que le store soit initialisé
    if (!userStore.user) {
      await userStore.init();
    }

    if (_to.path.includes("admin") && !userStore.user?.admin) {
      throw createError({
        statusCode: 403,
        statusMessage: "Accès administrateur requis",
      });
    }
    return;
  }

  // Côté serveur, faire une vérification API
  if (import.meta.server) {
    try {
      // Utiliser l'API pour vérifier les droits admin
      const response = await $fetch("/api/user/current");

      if (!response || (_to.path.includes("admin") && !response.admin)) {
        throw createError({
          statusCode: 403,
          statusMessage: "Accès administrateur requis",
        });
      }
    } catch {
      throw createError({
        statusCode: 403,
        statusMessage: "Accès administrateur requis",
      });
    }
  }
});
