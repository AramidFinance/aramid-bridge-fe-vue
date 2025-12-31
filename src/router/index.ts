import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'bridge',
      component: HomeView
    },
    {
      path: '/bridge/:sourceChain',
      name: 'bridge-sc',
      component: HomeView
    },
    {
      path: '/bridge/:sourceChain/:destinationChain',
      name: 'bridge-sc-dc',
      component: HomeView
    },
    {
      path: '/bridge/:sourceChain/:destinationChain/:sourceToken',
      name: 'bridge-sc-dc-st',
      component: HomeView
    },
    {
      path: '/bridge/:sourceChain/:destinationChain/:sourceToken/:destinationToken',
      name: 'bridge-sc-dc-st-dt',
      component: HomeView
    },
    {
      path: '/bridge/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAmount/:note',
      name: 'bridge-sc-dc-st-dt-a-n',
      component: HomeView
    },
    {
      path: '/bridge-a/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAddress/:destinationAddress/:sourceAmount/:note',
      name: 'bridge-sc-dc-st-dt-sa-da-a-n',
      component: HomeView
    },
    {
      path: '/optin/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAddress/:destinationAddress/:sourceAmount/:note',
      name: 'optin-sc-dc-st-dt-sa-da-a-n',
      component: () => import('../views/OptinView.vue')
    },
    {
      path: '/review/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAddress/:destinationAddress/:sourceAmount/:note',
      name: 'review-sc-dc-st-dt-sa-da-a-n',
      component: () => import('../views/ReviewView.vue')
    },
    {
      path: '/sign/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAddress/:destinationAddress/:sourceAmount/:note',
      name: 'sign-n',
      component: () => import('../views/SignView.vue')
    },
    {
      path: '/bridging/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAddress/:destinationAddress/:sourceAmount/:note',
      name: 'bridging',
      component: () => import('../views/SignView.vue')
    },
    {
      path: '/claim/',
      name: 'claim',
      component: () => import('../views/ClaimView.vue')
    },
    {
      path: '/claim/:sourceTxId',
      name: 'claim-t',
      component: () => import('../views/ClaimView.vue')
    },
    {
      path: '/arc200-claim/',
      name: 'arc200-claim',
      component: () => import('../views/Arc200ClaimView.vue')
    },
    {
      path: '/arc200-claim/:network/:tokenId/:amount/:direction',
      name: 'arc200-claim-t',
      component: () => import('../views/Arc200ClaimView.vue')
    }
    // {
    //   path: '/about',
    //   name: 'about',
    //   // route level code-splitting
    //   // this generates a separate chunk (About.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () => import('../views/AboutView.vue')
    // }
  ]
})

export default router
