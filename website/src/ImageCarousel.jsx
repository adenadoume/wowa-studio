import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectCube } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-cube'

export default function ImageCarousel({ images, rotateMs }) {
  return (
    <Swiper
      modules={[Autoplay, EffectCube]}
      direction="vertical"
      effect="cube"
      cubeEffect={{ shadow: false, slideShadows: false }}
      speed={950}
      loop
      allowTouchMove={false}
      autoplay={{ delay: rotateMs, disableOnInteraction: false }}
      className="carousel"
    >
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
