import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCube } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-cube'

const MAGENTA_SLIDE_MS = 1300

export default function ImageCarousel({ images, rotateMs }) {
  return (
    <Swiper
      modules={[Autoplay, EffectCube]}
      direction="vertical"
      effect="cube"
      cubeEffect={{ shadow: false, slideShadows: false }}
      speed={950}
      loop={images.length > 0}
      allowTouchMove={false}
      autoplay={{ delay: rotateMs, disableOnInteraction: false }}
      className="carousel"
    >
      <SwiperSlide className="carousel-slide" data-swiper-autoplay={MAGENTA_SLIDE_MS}>
        <div className="carousel-magenta" />
      </SwiperSlide>
      {images.map((image) => (
        <SwiperSlide key={image.src} className="carousel-slide">
          <img
            className={`frame${image.portrait ? ' frame-portrait' : ''}`}
            src={image.src}
            alt=""
          />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
