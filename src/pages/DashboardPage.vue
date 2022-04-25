<template>
    <master-layout pageTitle="Dashboard">
        <ion-card>
            <ion-card-header>
                <ion-card-title>Welcome!</ion-card-title>
            </ion-card-header>
        </ion-card>
        <ion-card-content>
            <ion-item>
                <ion-label>Owner Name:</ion-label>
                <ion-label>{{ authData.userName }}</ion-label>
            </ion-item>
        </ion-card-content>
    </master-layout>
</template>

<script>

import { IonCard,IonCardHeader,IonCardTitle,IonCardContent,IonItem,IonLabel,} from "@ionic/vue";
import { useStore } from 'vuex'
import { computed } from 'vue'

export default {
    components: {
        IonCard,IonCardHeader,IonCardTitle,IonCardContent,IonItem,IonLabel,
    },
    setup () {

        const store = useStore()
        
        const authData = computed(() => store.getters.auth.getAuthData)

        return {authData}
    }
}
</script>

<style lang="scss" scoped>

</style>