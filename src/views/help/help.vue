<template>
	<v-expansion-panels>
		<v-expansion-panel>
			<v-expansion-panel-header>How to install on smartphone</v-expansion-panel-header>
			<v-expansion-panel-content>
				<p class="mb-4">For the proper functioning of the application it is recommended to use google chrome.</p>
				<p class="mb-2">1 - Launch Chrome and go to https://iplaybitch.web.app</p>
				<p class="mb-2">2 - Click on Add to Homescreen</p>
				<p class="mb-2">3 - It's done</p>
				<v-expansion-panels>
					<v-expansion-panel>
						<v-expansion-panel-header>IPhone</v-expansion-panel-header>
						<v-expansion-panel-content>
							<p class="mb-4">
								Currently i play bitch cannot receive push notifications on iphone but you can use the app to send
								notifications to your friends.
							</p>
							<p>1 - Launch safari and go to https://iplaybitch.web.app</p>
							<p>2 - Click on <b>Add to Homescreen </b></p>
							<p>3 - It's done</p>
						</v-expansion-panel-content>
					</v-expansion-panel>
				</v-expansion-panels>
			</v-expansion-panel-content>
		</v-expansion-panel>
		<v-expansion-panel>
			<v-expansion-panel-header>How to enable push notifications on computer</v-expansion-panel-header>
			<v-expansion-panel-content>
				<p class="mb-4">On your favorite browser</p>
				<p class="mb-2">1 - Click on the <b>lock icon</b> on the left of the app adress.</p>
				<p class="mb-2">2 - Select <b>allow</b> notifications</p>
				<v-img src="http://localhost:8080/img/help/allowBrowser.png"></v-img>
			</v-expansion-panel-content>
		</v-expansion-panel>
		<v-expansion-panel>
			<v-expansion-panel-header>How to enable push notifications on android</v-expansion-panel-header>
			<v-expansion-panel-content>
				<p class="mb-4">If you don't have allow notifications you can do it manually.</p>
				<p class="mb-2">1 - Go to your android settings</p>
				<p class="mb-2">2 - Search Notifications</p>
				<p class="mb-4">3 - Search IPB and check im</p>
				<b>Or</b>
				<p class="mb-2 mt-4">1 - Push long time on the app icon</p>
				<p class="mb-2">2 - Click on app info</p>
				<p class="mb-2">3 - Click on notifications</p>
				<p class="mb-2">4 - Check display notification</p>
			</v-expansion-panel-content>
		</v-expansion-panel>
		<v-expansion-panel>
			<v-expansion-panel-header>How to enable push notifications on iphone</v-expansion-panel-header>
			<v-expansion-panel-content>
				Currently you can't enable push notifications on IPhone
			</v-expansion-panel-content>
		</v-expansion-panel>
		<v-expansion-panel>
			<v-expansion-panel-header>How to custom notification sound</v-expansion-panel-header>
			<v-expansion-panel-content>
				<p class="mb-4">
					You can download awesome sound notification on your
					<a href="https://iplaybitch.web.app/#/user/profile"> profile page </a>
				</p>
				<p class="mb-2">1 - After installing the application</p>
				<p class="mb-2">2 - Push long time on the app icon</p>
				<p class="mb-2">3 - Click on app info</p>
				<p class="mb-2">4 - Click on notifications</p>
				<p class="mb-2">5 - Click on notifications sound</p>
				<p class="mb-2">6 - Select the awesome sound you want</p>
			</v-expansion-panel-content>
		</v-expansion-panel>
		<v-expansion-panel>
			<v-expansion-panel-header>My app isn't update / encounter problems</v-expansion-panel-header>
			<v-expansion-panel-content>
				<v-expansion-panels>
					<v-expansion-panel>
						<v-expansion-panel-header>On your computer</v-expansion-panel-header>
						<v-expansion-panel-content>
							<p class="mb-4">1 - press CTRL+F5 to full refresh the app</p>
							<b>Or</b>
							<p class="mb-2 mt-4">1 - Click on the lock icon one the left of app adress</p>
							<p class="mb-2">2 - Click on site settings</p>
							<p class="mb-2">3 - Click on clear data</p>
							<p class="mb-4">4 - Press CTRL+F5</p>
						</v-expansion-panel-content>
					</v-expansion-panel>
					<v-expansion-panel>
						<v-expansion-panel-header>On your smartphone</v-expansion-panel-header>
						<v-expansion-panel-content>
							<p class="mb-2">1 - Refresh with scroll down on the app</p>
							<p class="mb-4">2 - Restart the application</p>
							<b>Or</b>
							<p class="mb-2 mt-4">1 - Push long time on the app icon</p>
							<p class="mb-2">2 - Click on uninstall</p>
							<p class="mb-2">2 - Go to <a href="https://iplaybitch.web.app"> IPlayBitch website</a></p>
							<p class="mb-4">3 - Click on add to homescreen</p>
							<b>Or</b>
							<p class="mb-2 mt-4">
								1 - Go to <a href="https://iplaybitch.web.app"> IPlayBitch website</a> with chrome
							</p>
							<p class="mb-2">2 - Click on the lock near app adress</p>
							<p class="mb-2">4 - Click on site settings</p>
							<p class="mb-2">5 - Click on clear data</p>
						</v-expansion-panel-content>
					</v-expansion-panel>
				</v-expansion-panels>
			</v-expansion-panel-content>
		</v-expansion-panel>
	</v-expansion-panels>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({});
</script>

<style scoped></style>
