// Adapted from shadcn/ui Carousel (MIT). See shadcn.LICENSE.md.
// https://ui.shadcn.com/docs/components/carousel

import * as React from "react"
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react"
import { ArrowLeft, ArrowRight } from "lucide-react"

const cn = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ")

type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
  opts?: CarouselOptions
  plugins?: CarouselPlugin
  orientation?: "horizontal" | "vertical"
  setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]
  api: ReturnType<typeof useEmblaCarousel>[1]
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} & CarouselProps

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins
  )
  const reducedMotion = React.useRef(false)
  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => { reducedMotion.current = query.matches }
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  const subscribe = React.useCallback((notify: () => void) => {
    if (!api) return () => {}
    api.on("select", notify)
    api.on("reInit", notify)
    return () => { api.off("select", notify); api.off("reInit", notify) }
  }, [api])
  const snapshot = React.useCallback(() =>
    (api?.canScrollPrev() ? 1 : 0) | (api?.canScrollNext() ? 2 : 0), [api])
  const availability = React.useSyncExternalStore(subscribe, snapshot, () => 0)
  const canScrollPrev = Boolean(availability & 1)
  const canScrollNext = Boolean(availability & 2)

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev(reducedMotion.current)
  }, [api])

  const scrollNext = React.useCallback(() => {
    api?.scrollNext(reducedMotion.current)
  }, [api])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        scrollPrev()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        scrollNext()
      }
    },
    [scrollPrev, scrollNext]
  )

  React.useEffect(() => {
    if (!api || !setApi) return
    setApi(api)
  }, [api, setApi])


  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel()

  return (
    <div
      ref={carouselRef}
      className="overflow-hidden touch-pan-y p-1.5 -m-1.5"
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel()

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className
      )}
      {...props}
    />
  )
}

function CarouselPrevious({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()

  return (
    <button
      data-slot="carousel-previous"
      type="button"
      className={cn(
        "study-button size-11 shrink-0 p-0",
        orientation === "vertical" ? "rotate-90" : "",
        className
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft size={18} aria-hidden="true" />
      <span className="sr-only">Previous slide</span>
    </button>
  )
}

function CarouselNext({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { orientation, scrollNext, canScrollNext } = useCarousel()

  return (
    <button
      data-slot="carousel-next"
      type="button"
      className={cn(
        "study-button size-11 shrink-0 p-0",
        orientation === "vertical" ? "rotate-90" : "",
        className
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight size={18} aria-hidden="true" />
      <span className="sr-only">Next slide</span>
    </button>
  )
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
