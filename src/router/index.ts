import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ReviewView from '../views/ReviewView.vue'

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
      path: '/bridge/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAmount',
      name: 'bridge-sc-dc-st-dt-a',
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
      path: '/bridge-a/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAddress/:destinationAddress/:sourceAmount',
      name: 'bridge-sc-dc-st-dt-sa-da-a',
      component: HomeView
    },
    {
      path: '/review/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAmount',
      name: 'review-sc-dc-st-dt-a',
      component: ReviewView
    },
    {
      path: '/review/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAmount/:note',
      name: 'review-sc-dc-st-dt-a-n',
      component: ReviewView
    },
    {
      path: '/review-a/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAddress/:destinationAddress/:sourceAmount',
      name: 'review-sc-dc-st-dt-sa-da-a',
      component: ReviewView
    },
    {
      path: '/review-a/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAddress/:destinationAddress/:sourceAmount/:note',
      name: 'review-sc-dc-st-dt-sa-da-a-n',
      component: ReviewView
    },
    {
      path: '/sign/:sourceChain/:destinationChain/:sourceToken/:destinationToken/:sourceAddress/:destinationAddress/:sourceAmount/:note',
      name: 'sign',
      component: () => import('../views/SignView.vue')
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
