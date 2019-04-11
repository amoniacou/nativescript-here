import * as application from 'tns-core-modules/application';
import Vue from "nativescript-vue";

import Home     from "./components/Home";
import { Here } from "nativescript-here";

application.on('launch', () => {
    Here.init('D5cvavcmw3ZD6nrBvJd6', 'CR1uPdZuE6fQMmA0DeHmAw', 'Dm13nsc7u07VrGs4Vujw97dymHsY5ctr36LeIcBrIVvGRE3cnjH6q6rOCb1nvghF9mHQVVgn8z5QYOKEuqdu/tZk0sfIca1LdnFcEg75Q3oA9JTJARc4NYFW4WlDY6PDEWeolzjwl12RojVY/u/SQnEaQHUVZR7KijgqXbHcCotjRJG9hwOAtZQ+mPDnC9YxViINloERWadRytTOokqvek+fhGmJ2DdvlnDaVl92qsy1b8QuCzxHfsuctl8E9uEY5gI1hyWNjaGOlHaucBYsodgqwOUc6k8EbSwOI4i0qm6yJQgpt2pg/XTMwwT6pBT4XhJwndwDRBuvpVA+F6mVfLd0vw6DAzIFfdLFBuTXoubgkyjcvc8V4KuBkf3nBNK91WNbB/869wC9B4hgQLU44/ZOWGSXevS1nMB+SJWF42nOptxept7HTMLLYRO6to/qwC0rMPF+aUib4AOuGXCj8zu6tGKMGgPBlGo7vuF0eDUa4pwo4m4vTJTpGcOC6Ig4qdU3UivEsGLiq6gf+PtpqYu6rOgbec075bkkpfYtRksVsa32Y9Q34EsPb9HFBHs+BaYpAkOj8NbudB06iUlhdfpIQZzsTzXOwiZtVxouReVedTGatWeKXp3BDxKygGt3G/uVTWy8u89uirc38BHmKhU+2FOoRx2Kd5WYl41MCI8=');
})

Vue.registerElement('HereMap', () => Here);

new Vue({

    template: `
        <Frame>
            <Home />
        </Frame>`,

    components: {
        Home
    }
}).$start();
