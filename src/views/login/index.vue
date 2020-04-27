<template>
  <v-content>
    <v-container class="fill-height" fluid>
      <v-row align="center" justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card>
            <v-card-title class="red--text">
              <h3>Sign-in</h3>
            </v-card-title>
            <v-card-text>
              <v-form>
                <v-text-field
                  label="User"
                  ref="loginElement"
                  name="login"
                  prepend-icon="mdi-account"
                  type="text"
                  v-model="username"
                  :readonly="loading"
                  @keypress.enter="login"
                ></v-text-field>
                <v-text-field
                  id="password"
                  label="Password"
                  name="password"
                  prepend-icon="mdi-lock"
                  type="password"
                  v-model="password"
                  @keypress.enter="login"
                  :readonly="loading"
                ></v-text-field>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn tile outlined color="primary" :disabled="loading" @click="register"
                ><b>New account</b></v-btn
              >
              <v-btn tile color="primary" :loading="loading" @click="login"
                >Sign-in</v-btn
              >
            </v-card-actions>
            <v-card-text v-if="errorMessage != ''">
              <v-alert type="warning">{{ errorMessage }}</v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-content>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { UserModule } from "@/store/modules/user";

@Component({
  name: "Login"
})
export default class extends Vue {
  public username: string = "";
  public password: string = "";
  public loading: Boolean = false;
  public errorMessage: string = "";

  public register(){
    this.$router.push("/register");
  }

  public login() {
    this.loading = true;
    this.errorMessage = "";

    const { username, password } = this;
    UserModule.Login({ username, password })
      .then(() => {
        this.username = "";
        this.password = "";
        this.$router.push("/");
      })
      .catch(reason => {
        this.errorMessage = reason;
      })
      .finally(() => {
        this.loading = false;
      });
  }
}
</script>
