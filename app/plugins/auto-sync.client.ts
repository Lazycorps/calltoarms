export default defineNuxtPlugin(() => {
  // Ce plugin ne s'exécute que côté client
  if (import.meta.server) return;

  const user = useSupabaseUser();

  // Attendre que l'utilisateur soit chargé
  watch(
    user,
    async (newUser) => {
      if (newUser) {
        // Utilisateur connecté, lancer la synchronisation automatique
        const gamingPlatformsStore = useGamingPlatformsStore();
        const snackbarStore = useSnackbarStore();

        try {
          // Charger d'abord les plateformes
          await gamingPlatformsStore.loadPlatforms();

          if (gamingPlatformsStore.connectedPlatforms.length > 0) {
            // Lancer la synchronisation en arrière-plan
            gamingPlatformsStore
              .syncAllPlatforms()
              .then((result) => {
                if (result.summary.success > 0) {
                  const message =
                    result.summary.errors > 0
                      ? `${result.summary.success} plateforme${
                          result.summary.success > 1 ? "s" : ""
                        } synchronisée${
                          result.summary.success > 1 ? "s" : ""
                        }, ${result.summary.errors} erreur${
                          result.summary.errors > 1 ? "s" : ""
                        }`
                      : `${result.summary.success} plateforme${
                          result.summary.success > 1 ? "s" : ""
                        } synchronisée${
                          result.summary.success > 1 ? "s" : ""
                        } avec succès`;

                  snackbarStore.showSuccess(message, 3000);
                } else if (result.summary.errors > 0) {
                  snackbarStore.showWarning(
                    `Erreur lors de la synchronisation de ${
                      result.summary.errors
                    } plateau${result.summary.errors > 1 ? "x" : ""}`,
                    4000
                  );
                }
              })
              .catch((error) => {
                console.error(
                  "Erreur lors de la synchronisation automatique:",
                  error
                );
              });

            // Charger les jeux existants
            await gamingPlatformsStore.loadGames();
          }
        } catch (error) {
          console.error("Erreur lors de l'initialisation automatique:", error);
        }
      }
    },
    { immediate: true }
  );
});
