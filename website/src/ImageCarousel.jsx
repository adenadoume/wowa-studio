import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

const MAGENTA_SLIDE_MS = 1300

export default function ImageCarousel({ images, rotateMs, showMagenta, onMagentaPassed }) {
  return (
    <Swiper
      modules={[Autoplay]}
      direction="vertical"
      speed={700}
      loop={images.length > 0}
      allowTouchMove={false}
      autoplay={{ delay: rotateMs, disableOnInteraction: false }}
      onSlideChange={(swiper) => {
        if (showMagenta && swiper.realIndex !== 0) onMagentaPassed()
      }}
      className="carousel"
    >
      {showMagenta && (
        <SwiperSlide className="carousel-slide" data-swiper-autoplay={MAGENTA_SLIDE_MS}>
          <div className="carousel-magenta" />
        </SwiperSlide>
      )}
      {images.map((image) => (
        <SwiperSlide key={image.src} className="carousel-slide">
          <img className="frame" src={image.src} alt="" />
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
