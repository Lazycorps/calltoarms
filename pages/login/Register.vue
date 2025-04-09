<template>
  <v-container fluid class="fill-height d-flex justify-center align-center">
    <v-card
      style="max-width: 500px; width: 100%"
      class="pa-5 d-flex flex-column"
      rounded="100"
    >
      <v-form
        ref="formComponent"
        v-model="formIsValid"
        :validate-on="validateOn"
      >
        <v-card-title>Create an account</v-card-title>
        <v-text-field
          v-model="email"
          label="Email"
          :rules="[rules.required, rules.email]"
          class="mb-2"
        />
        <v-text-field
          v-model="password"
          :type="passwordType"
          label="Password"
          append-inner-icon="mdi-eye"
          :rules="[rules.required, rules.passwordComplexity]"
          class="mb-2"
          @click:append-inner="
            passwordType == 'password'
              ? (passwordType = 'text')
              : (passwordType = 'password')
          "
        />
        <v-alert v-if="errorDisplay" type="error" class="mb-5" variant="tonal">
          {{ errorDisplay }}
        </v-alert>
        <div class="align-self-end">
          <v-btn color="primary" variant="text" @click="router.push('/login')"
            >Sign In</v-btn
          >
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="register()"
            >Register</v-btn
          >
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { VForm } from "vuetify/lib/components/index.mjs";
const router = useRouter();

const formComponent = ref<VForm>();
const passwordType = ref<"password" | "text">("password");

const email = ref("");
const password = ref("");
const errorDisplay = ref("");
const formIsValid = ref(false);
const validateOn = ref<"input" | "submit">("submit");
const loading = ref(false);
const rules = {
  required: (v: string) => !!v || "Required.",
  min: (v: string) => v.length >= 4 || "Min 4 characters",
  max: (v: string) => v.length <= 12 || "Min 12 characters",
  email: (v: string) => /.+@.+\..+/.test(v) || "Must be a valid email",
  passwordComplexity: (v: string) =>
    /^(?=.*[A-ZÀ-ÖØ-Þ])(?=.*\d)[A-Za-zÀ-öø-ÿ\d~`!@#$%^&*()-_+={}|;:'",.<>?\\]{8,}$/.test(
      v
    ) || "Minimum eight characters, at least uppercase letter and one number:",
};

async function register() {
  try {
    await formComponent.value?.validate();
    if (!formIsValid.value) return;
    loading.value = true;
    // const supabase = useSupabaseClient();
    // const { error } = await supabase.auth.signUp({
    //   email: email.value,
    //   password: password.value,
    // });
    // if (error) errorDisplay.value = error.message;
    // else router.push("registerValidation");
  } finally {
    validateOn.value = "input";
    loading.value = false;
  }
}
</script>
