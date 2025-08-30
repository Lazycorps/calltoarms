<template>
  <v-container fluid class="fill-height d-flex justify-center align-center">
    <v-card
      style="max-width: 500px; width: 100%"
      class="pa-5 d-flex flex-column"
      rounded="100"
    >
      <v-card-title>Sign In </v-card-title>
      <v-text-field v-model="email" label="Email" />
      <v-text-field
        v-model="password"
        :type="passwordType"
        label="Password"
        append-inner-icon="mdi-eye"
        @click:append-inner="
          passwordType == 'password'
            ? (passwordType = 'text')
            : (passwordType = 'password')
        "
      />
      <v-alert v-if="displayError" type="error" class="mb-5" variant="tonal">
        {{ displayError }}
      </v-alert>
      <v-alert
        v-if="successMessage"
        type="success"
        class="mb-5"
        variant="tonal"
      >
        {{ successMessage }}
      </v-alert>
      <div class="align-self-end">
        <v-btn
          class="mr-5"
          color="primary"
          variant="text"
          @click="router.push('./login/register')"
          >register</v-btn
        >
        <v-btn color="primary" variant="flat" @click="signIn">Sign In</v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const router = useRouter();
const user = useUserStore();

const passwordType = ref<"password" | "text">("password");
const email = ref("");
const password = ref("");

const successMessage = ref("");
const displayError = ref("");

async function signIn() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) displayError.value = error.message;
    else {
      if (data.user.email) {
        await user.signIn(data.user.id, data.user.email);
      } else displayError.value = "Missing email";
      router.push("/");
    }
  } catch (err) {
    displayError.value = "Invalid email or password.";
    console.log(err);
  }
}
</script>
