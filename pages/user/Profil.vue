<template>
  <v-card
    flat
    rounded
    class="mx-auto my-auto pa-5"
    style="max-width: 500px; width: 100%"
  >
    <div>
      <v-card class="mx-auto ma-0" :title="username" flat>
        <template #prepend>
          <v-avatar color="blue-darken-2">
            <v-icon icon="mdi-account" />
          </v-avatar>
        </template>
        <v-card-text>
          <v-text-field v-model="email" label="Email" readonly />
          <v-text-field
            v-model="username"
            label="Username"
            :rules="[rules.required, rules.min, rules.max]"
            @update:model-value="userNameChanged = true"
          >
            <template #append-inner>
              <v-avatar v-if="userNameChanged" :loading="loadingUpdateUser">
                <v-icon icon="mdi-floppy" @click="updateUsername" />
              </v-avatar>
            </template>
          </v-text-field>
        </v-card-text>
      </v-card>
    </div>
    <div class="d-flex justify-end">
      <v-btn
        :disabled="loading"
        prepend-icon="mdi-logout"
        color="red"
        @click="signOut"
      >
        Logout
      </v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();
const loading = ref(true);
const username = ref("");
const email = ref("");
const userNameChanged = ref(false);
const rules = {
  required: (v: string) => !!v || "Required.",
  min: (v: string) => v.length >= 4 || "Min 4 characters",
  max: (v: string) => v.length <= 16 || "Max 16 characters",
  email: (v: string) => /.+@.+\..+/.test(v) || "Must be a valid email",
  passwordComplexity: (v: string) =>
    /^(?=.*[A-ZÀ-ÖØ-Þ])(?=.*\d)[A-Za-zÀ-öø-ÿ\d~`!@#$%^&*()-_+={}|;:'",.<>?\\]{8,}$/.test(
      v
    ) || "Minimum eight characters, at least uppercase letter and one number:",
};
const loadingUpdateUser = ref(false);
onMounted(async () => {
  await fetchUser();
});

async function fetchUser() {
  try {
    loading.value = true;
    const userConnected = await $fetch("/api/user/current");
    username.value = userConnected?.name ?? "";
    email.value = userConnected?.email ?? "";
  } finally {
    loading.value = false;
  }
}

async function updateUsername() {
  try {
    loadingUpdateUser.value = true;
    const userUpdated = await $fetch("/api/user/username", {
      method: "POST",
      body: {
        username: username.value,
      },
    });
    username.value = userUpdated?.name ?? "";
  } finally {
    loadingUpdateUser.value = false;
  }
}

async function signOut() {
  try {
    loading.value = true;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    router.push("/login");
  } finally {
    loading.value = false;
  }
}
</script>
