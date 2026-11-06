import type { StylePreset } from "./types";

/** Complete clean-room generative style presets catalog (129 styles) */
export const STYLES_CATALOG: StylePreset[] = [
  {
    "id": "photorealistic",
    "name": "Photorealistic",
    "category": "Photography",
    "desc": "Highly detailed, believable photography with natural materials and light.",
    "tags": [
      "realistic",
      "photo",
      "natural"
    ],
    "prompt": "photorealistic, realistic materials, natural skin texture, physically believable lighting, fine camera detail",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": false
  },
  {
    "id": "portrait-photography",
    "name": "Portrait Photography",
    "category": "Photography",
    "desc": "Clean portrait lighting, natural skin texture, and controlled depth of field.",
    "tags": [
      "portrait",
      "people",
      "lens"
    ],
    "prompt": "professional portrait photography, natural skin texture, flattering key light, shallow depth of field, realistic lens rendering",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "landscape-photography",
    "name": "Landscape Photography",
    "category": "Photography",
    "desc": "Vibrant natural landscapes with depth, atmosphere, and crisp detail.",
    "tags": [
      "landscape",
      "nature",
      "photo"
    ],
    "prompt": "landscape photography, expansive natural scenery, atmospheric depth, crisp environmental detail, balanced natural light",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "macro-photography",
    "name": "Macro Photography",
    "category": "Photography",
    "desc": "Extreme close detail with shallow focus and realistic optical falloff.",
    "tags": [
      "macro",
      "detail",
      "closeup"
    ],
    "prompt": "macro photography, extreme close detail, shallow depth of field, realistic optical bokeh, precise textures",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "street-photography",
    "name": "Street Photography",
    "category": "Photography",
    "desc": "Candid urban moments with documentary framing and available light.",
    "tags": [
      "street",
      "urban",
      "candid"
    ],
    "prompt": "street photography, candid moment, available urban light, documentary framing, authentic environment",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "fashion-photography",
    "name": "Fashion Photography",
    "category": "Photography",
    "desc": "Editorial fashion imagery with polished lighting and strong posing.",
    "tags": [
      "fashion",
      "editorial",
      "studio"
    ],
    "prompt": "editorial fashion photography, polished studio lighting, confident pose, premium styling, crisp lens detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "product-photography",
    "name": "Product Photography",
    "category": "Photography",
    "desc": "Clean commercial product images with controlled reflections and detail.",
    "tags": [
      "product",
      "commercial",
      "studio"
    ],
    "prompt": "commercial product photography, clean background, controlled reflections, precise materials, premium studio lighting",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "sports-photography",
    "name": "Sports Photography",
    "category": "Photography",
    "desc": "Fast action frozen with dynamic composition and realistic motion cues.",
    "tags": [
      "sports",
      "action",
      "photo"
    ],
    "prompt": "professional sports photography, dynamic action framing, fast shutter clarity, realistic motion energy, stadium detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "wildlife-photography",
    "name": "Wildlife Photography",
    "category": "Photography",
    "desc": "Natural animal behavior with long lens depth and environmental realism.",
    "tags": [
      "wildlife",
      "nature",
      "telephoto"
    ],
    "prompt": "wildlife photography, natural animal behavior, telephoto lens compression, environmental realism, natural light",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "night-photography",
    "name": "Night Photography",
    "category": "Photography",
    "desc": "Low light photography with realistic highlights, shadows, and atmosphere.",
    "tags": [
      "night",
      "low light",
      "photo"
    ],
    "prompt": "night photography, realistic low light exposure, controlled highlights, deep natural shadows, atmospheric detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "cinematic-realism",
    "name": "Cinematic Realism",
    "category": "Cinematic",
    "desc": "Filmic realism with motivated lighting, color, and visual depth.",
    "tags": [
      "cinematic",
      "film",
      "realistic"
    ],
    "prompt": "cinematic realism, motivated film lighting, filmic color grading, atmospheric depth, realistic production design",
    "best": [
      "FLUX",
      "WAN 2.2",
      "Veo"
    ],
    "isNsfw": false
  },
  {
    "id": "cinematic-epic",
    "name": "Cinematic Epic",
    "category": "Cinematic",
    "desc": "Large scale dramatic imagery with bold light and heroic framing.",
    "tags": [
      "cinematic",
      "epic",
      "drama"
    ],
    "prompt": "epic cinematic composition, monumental scale, dramatic lighting, heroic framing, atmospheric depth",
    "best": [
      "FLUX",
      "SDXL",
      "WAN 2.2"
    ],
    "isNsfw": false
  },
  {
    "id": "hollywood-blockbuster",
    "name": "Hollywood Blockbuster",
    "category": "Cinematic",
    "desc": "Polished high budget film look with dramatic action lighting.",
    "tags": [
      "movie",
      "action",
      "polished"
    ],
    "prompt": "Hollywood blockbuster look, high budget production design, dramatic action lighting, polished cinematic color grade",
    "best": [
      "FLUX",
      "WAN 2.2",
      "Veo"
    ],
    "isNsfw": false
  },
  {
    "id": "film-noir",
    "name": "Film Noir",
    "category": "Cinematic",
    "desc": "High contrast shadows, moody framing, and classic noir atmosphere.",
    "tags": [
      "noir",
      "shadow",
      "film"
    ],
    "prompt": "film noir, high contrast black and white lighting, hard shadows, smoky atmosphere, classic detective cinema framing",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "neo-noir",
    "name": "Neo Noir",
    "category": "Cinematic",
    "desc": "Modern noir with colored practical lights and deep contrast.",
    "tags": [
      "neo noir",
      "moody",
      "night"
    ],
    "prompt": "neo noir cinema, deep contrast, colored practical lighting, wet reflective streets, tense modern atmosphere",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "indie-film",
    "name": "Indie Film",
    "category": "Cinematic",
    "desc": "Naturalistic low budget cinema with intimate framing and soft color.",
    "tags": [
      "indie",
      "natural",
      "film"
    ],
    "prompt": "independent film aesthetic, intimate naturalistic framing, available light, restrained color grade, authentic texture",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "anamorphic-cinema",
    "name": "Anamorphic Cinema",
    "category": "Cinematic",
    "desc": "Wide cinematic framing with anamorphic flare and lens character.",
    "tags": [
      "anamorphic",
      "wide",
      "lens"
    ],
    "prompt": "anamorphic cinema, widescreen framing, subtle horizontal lens flares, oval bokeh, cinematic lens character",
    "best": [
      "FLUX",
      "WAN 2.2"
    ],
    "isNsfw": false
  },
  {
    "id": "golden-hour-cinema",
    "name": "Golden Hour Cinema",
    "category": "Cinematic",
    "desc": "Warm cinematic sunlight with soft atmosphere and emotional tone.",
    "tags": [
      "golden hour",
      "warm",
      "cinematic"
    ],
    "prompt": "cinematic golden hour, warm backlight, soft atmospheric haze, emotional film color, natural lens bloom",
    "best": [
      "FLUX",
      "SDXL",
      "WAN 2.2"
    ],
    "isNsfw": false
  },
  {
    "id": "sci-fi-cinema",
    "name": "Sci Fi Cinema",
    "category": "Cinematic",
    "desc": "Sleek future production design with cinematic scale and lighting.",
    "tags": [
      "sci fi",
      "cinematic",
      "future"
    ],
    "prompt": "cinematic science fiction, futuristic production design, volumetric lighting, grand scale, polished film realism",
    "best": [
      "FLUX",
      "WAN 2.2"
    ],
    "isNsfw": false
  },
  {
    "id": "western-cinema",
    "name": "Western Cinema",
    "category": "Cinematic",
    "desc": "Dusty landscapes, warm sunlight, and classic western composition.",
    "tags": [
      "western",
      "desert",
      "film"
    ],
    "prompt": "cinematic western, dusty frontier landscape, warm directional sunlight, classic wide framing, weathered period detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "stylized-realism",
    "name": "Stylized Realism",
    "category": "Art",
    "desc": "Believable subjects with polished artistic detail and heightened design.",
    "tags": [
      "realism",
      "art",
      "polished"
    ],
    "prompt": "stylized realism, believable anatomy, polished artistic detail, rich textures, controlled color design",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": false
  },
  {
    "id": "oil-painting",
    "name": "Oil Painting",
    "category": "Art",
    "desc": "Layered brushwork, rich pigment, and traditional painted depth.",
    "tags": [
      "oil",
      "painting",
      "classic"
    ],
    "prompt": "traditional oil painting, visible layered brushwork, rich pigments, canvas texture, classical lighting",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "watercolor",
    "name": "Watercolor",
    "category": "Art",
    "desc": "Transparent washes, soft edges, and textured paper.",
    "tags": [
      "watercolor",
      "paper",
      "soft"
    ],
    "prompt": "watercolor painting, translucent washes, soft edges, textured paper, subtle pigment blooms",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "acrylic-painting",
    "name": "Acrylic Painting",
    "category": "Art",
    "desc": "Bold opaque paint, crisp color blocks, and textured strokes.",
    "tags": [
      "acrylic",
      "paint",
      "bold"
    ],
    "prompt": "acrylic painting, opaque layered color, textured brush strokes, bold shapes, rich contemporary palette",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "impressionism",
    "name": "Impressionism",
    "category": "Art",
    "desc": "Loose brushwork, luminous color, and atmospheric light.",
    "tags": [
      "impressionist",
      "light",
      "paint"
    ],
    "prompt": "impressionist painting, loose visible brushwork, luminous color, atmospheric light, painterly movement",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "surrealism",
    "name": "Surrealism",
    "category": "Art",
    "desc": "Dreamlike impossible imagery with polished fine art composition.",
    "tags": [
      "surreal",
      "dream",
      "art"
    ],
    "prompt": "surrealist fine art, dreamlike impossible imagery, symbolic composition, uncanny scale, polished painterly detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "pop-art",
    "name": "Pop Art",
    "category": "Art",
    "desc": "Graphic color, bold contrast, and punchy commercial art energy.",
    "tags": [
      "pop",
      "graphic",
      "bold"
    ],
    "prompt": "pop art, bold graphic color, strong outlines, punchy contrast, commercial print energy",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "abstract-expressionism",
    "name": "Abstract Expressionism",
    "category": "Art",
    "desc": "Energetic marks, layered color, and expressive visual movement.",
    "tags": [
      "abstract",
      "expressive",
      "paint"
    ],
    "prompt": "abstract expressionism, energetic gestural marks, layered paint, expressive color fields, dynamic visual rhythm",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "art-deco",
    "name": "Art Deco",
    "category": "Art",
    "desc": "Elegant geometry, symmetry, metallic detail, and luxury design.",
    "tags": [
      "deco",
      "geometric",
      "luxury"
    ],
    "prompt": "art deco style, elegant geometric symmetry, luxurious metallic accents, streamlined shapes, sophisticated ornament",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "art-nouveau",
    "name": "Art Nouveau",
    "category": "Art",
    "desc": "Flowing organic lines, floral decoration, and elegant ornamental design.",
    "tags": [
      "nouveau",
      "organic",
      "ornate"
    ],
    "prompt": "art nouveau, flowing organic linework, floral ornament, elegant curves, decorative illustrated composition",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "editorial-illustration",
    "name": "Editorial Illustration",
    "category": "Illustration",
    "desc": "Clean conceptual illustration built for articles and publications.",
    "tags": [
      "editorial",
      "concept",
      "clean"
    ],
    "prompt": "editorial illustration, clear visual concept, polished shapes, restrained palette, publication quality",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "storybook-illustration",
    "name": "Storybook Illustration",
    "category": "Illustration",
    "desc": "Warm whimsical illustrated scenes with inviting character design.",
    "tags": [
      "storybook",
      "whimsical",
      "warm"
    ],
    "prompt": "storybook illustration, whimsical characters, warm color palette, charming hand drawn detail, inviting narrative scene",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "comic-book",
    "name": "Comic Book",
    "category": "Illustration",
    "desc": "Dynamic ink lines, dramatic panels, and bold comic color.",
    "tags": [
      "comic",
      "ink",
      "action"
    ],
    "prompt": "comic book illustration, dynamic ink linework, dramatic action composition, bold color, graphic shadow shapes",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "graphic-novel",
    "name": "Graphic Novel",
    "category": "Illustration",
    "desc": "Mature illustrated storytelling with cinematic composition and ink texture.",
    "tags": [
      "graphic novel",
      "ink",
      "moody"
    ],
    "prompt": "graphic novel illustration, cinematic panel composition, expressive ink texture, mature color palette, dramatic shadows",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "ink-drawing",
    "name": "Ink Drawing",
    "category": "Illustration",
    "desc": "Expressive monochrome linework with traditional pen texture.",
    "tags": [
      "ink",
      "line art",
      "monochrome"
    ],
    "prompt": "traditional ink drawing, expressive pen linework, cross hatching, paper texture, crisp monochrome detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "pencil-sketch",
    "name": "Pencil Sketch",
    "category": "Illustration",
    "desc": "Natural graphite shading, loose construction, and paper grain.",
    "tags": [
      "pencil",
      "sketch",
      "graphite"
    ],
    "prompt": "pencil sketch, graphite shading, visible construction lines, natural paper grain, hand drawn detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "colored-pencil",
    "name": "Colored Pencil",
    "category": "Illustration",
    "desc": "Layered colored pencil texture with fine hand drawn detail.",
    "tags": [
      "pencil",
      "color",
      "hand drawn"
    ],
    "prompt": "colored pencil illustration, layered pencil texture, fine hand drawn detail, soft blended color, paper grain",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "vector-illustration",
    "name": "Vector Illustration",
    "category": "Illustration",
    "desc": "Clean scalable shapes with crisp edges and controlled palette.",
    "tags": [
      "vector",
      "clean",
      "flat"
    ],
    "prompt": "vector illustration, clean geometric shapes, crisp edges, controlled color palette, polished modern graphic design",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "technical-illustration",
    "name": "Technical Illustration",
    "category": "Illustration",
    "desc": "Precise explanatory drawing with clean structure and detail.",
    "tags": [
      "technical",
      "diagram",
      "precise"
    ],
    "prompt": "technical illustration, precise clean linework, clear mechanical detail, controlled perspective, informative presentation",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "vintage-poster",
    "name": "Vintage Poster",
    "category": "Illustration",
    "desc": "Illustrated poster composition with bold type era shapes and print texture.",
    "tags": [
      "poster",
      "vintage",
      "print"
    ],
    "prompt": "vintage illustrated poster, bold period shapes, limited print palette, screen print texture, strong graphic composition",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "anime-cinematic",
    "name": "Anime Cinematic",
    "category": "Animation",
    "desc": "Clean anime design with cinematic lighting, framing, and depth.",
    "tags": [
      "anime",
      "cinematic",
      "character"
    ],
    "prompt": "cinematic anime style, clean linework, expressive character design, detailed background, dramatic lighting",
    "best": [
      "SDXL",
      "Pony",
      "Illustrious"
    ],
    "isNsfw": false
  },
  {
    "id": "classic-anime",
    "name": "Classic Anime",
    "category": "Animation",
    "desc": "Traditional cel anime styling with clean line art and painted backgrounds.",
    "tags": [
      "anime",
      "cel",
      "classic"
    ],
    "prompt": "classic cel anime, clean hand drawn linework, flat cel shading, painted background, traditional animation color",
    "best": [
      "SDXL",
      "Pony"
    ],
    "isNsfw": false
  },
  {
    "id": "modern-anime",
    "name": "Modern Anime",
    "category": "Animation",
    "desc": "High detail contemporary anime with vivid light and polished rendering.",
    "tags": [
      "anime",
      "modern",
      "vivid"
    ],
    "prompt": "modern anime illustration, polished linework, vivid lighting, detailed character rendering, cinematic color",
    "best": [
      "SDXL",
      "Pony",
      "Illustrious"
    ],
    "isNsfw": false
  },
  {
    "id": "western-cartoon",
    "name": "Western Cartoon",
    "category": "Animation",
    "desc": "Expressive cartoon forms with clean shapes and bright readable color.",
    "tags": [
      "cartoon",
      "western",
      "clean"
    ],
    "prompt": "western cartoon style, expressive character shapes, clean outlines, bright readable color, animation ready design",
    "best": [
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "2d-cel-animation",
    "name": "2D Cel Animation",
    "category": "Animation",
    "desc": "Flat cel shaded animation frames with strong silhouettes.",
    "tags": [
      "2d",
      "cel",
      "animation"
    ],
    "prompt": "2D cel animation, clean outlines, flat cel shading, strong silhouettes, animation frame composition",
    "best": [
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "3d-animated-film",
    "name": "3D Animated Film",
    "category": "Animation",
    "desc": "Polished stylized 3D characters with soft global illumination.",
    "tags": [
      "3d",
      "animation",
      "film"
    ],
    "prompt": "stylized 3D animated film, polished character modeling, soft global illumination, expressive proportions, cinematic render",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "clay-animation",
    "name": "Clay Animation",
    "category": "Animation",
    "desc": "Handmade clay characters with miniature sets and tactile lighting.",
    "tags": [
      "clay",
      "stop motion",
      "miniature"
    ],
    "prompt": "clay animation, handcrafted clay textures, miniature practical set, soft stop motion lighting, tactile detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "stop-motion",
    "name": "Stop Motion",
    "category": "Animation",
    "desc": "Practical miniature animation with frame by frame handmade character.",
    "tags": [
      "stop motion",
      "practical",
      "miniature"
    ],
    "prompt": "stop motion animation aesthetic, practical miniature set, handcrafted character, frame by frame texture, studio lighting",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "paper-cutout",
    "name": "Paper Cutout",
    "category": "Animation",
    "desc": "Layered paper shapes with crafted shadows and handmade texture.",
    "tags": [
      "paper",
      "cutout",
      "craft"
    ],
    "prompt": "paper cutout animation style, layered paper shapes, handmade texture, soft crafted shadows, playful composition",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "retro-animation",
    "name": "Retro Animation",
    "category": "Animation",
    "desc": "Mid century television animation with limited color and simple forms.",
    "tags": [
      "retro",
      "animation",
      "vintage"
    ],
    "prompt": "retro television animation, mid century shapes, limited palette, simple graphic backgrounds, vintage cel texture",
    "best": [
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "high-fantasy",
    "name": "High Fantasy",
    "category": "Fantasy",
    "desc": "Epic magical worlds with heroic scale and rich environmental detail.",
    "tags": [
      "fantasy",
      "epic",
      "magic"
    ],
    "prompt": "high fantasy, epic magical world, heroic scale, intricate costume and architecture, luminous atmosphere",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "dark-fantasy",
    "name": "Dark Fantasy",
    "category": "Fantasy",
    "desc": "Gothic worlds with ominous light, ancient detail, and brooding mood.",
    "tags": [
      "fantasy",
      "dark",
      "moody"
    ],
    "prompt": "dark fantasy, gothic atmosphere, ancient weathered detail, ominous lighting, brooding cinematic scale",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "fairy-tale",
    "name": "Fairy Tale",
    "category": "Fantasy",
    "desc": "Enchanting storybook magic with whimsical environments and soft glow.",
    "tags": [
      "fairy tale",
      "magic",
      "whimsical"
    ],
    "prompt": "fairy tale fantasy, enchanting magical environment, whimsical detail, soft luminous glow, storybook atmosphere",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "mythic-fantasy",
    "name": "Mythic Fantasy",
    "category": "Fantasy",
    "desc": "Ancient legendary imagery with monumental figures and sacred atmosphere.",
    "tags": [
      "mythic",
      "legend",
      "epic"
    ],
    "prompt": "mythic fantasy, ancient legendary figures, monumental scale, sacred atmosphere, dramatic symbolic lighting",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "sword-and-sorcery",
    "name": "Sword and Sorcery",
    "category": "Fantasy",
    "desc": "Rugged adventurers, ancient ruins, and dangerous magical worlds.",
    "tags": [
      "sword",
      "adventure",
      "magic"
    ],
    "prompt": "sword and sorcery fantasy, rugged adventurer, ancient ruins, dangerous magic, dramatic pulp adventure lighting",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "elven-fantasy",
    "name": "Elven Fantasy",
    "category": "Fantasy",
    "desc": "Elegant woodland magic, luminous architecture, and refined detail.",
    "tags": [
      "elf",
      "forest",
      "magic"
    ],
    "prompt": "elven fantasy, elegant woodland realm, luminous natural architecture, refined costume detail, ethereal light",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "dragon-fantasy",
    "name": "Dragon Fantasy",
    "category": "Fantasy",
    "desc": "Massive dragons, dramatic landscapes, and cinematic magical scale.",
    "tags": [
      "dragon",
      "epic",
      "fantasy"
    ],
    "prompt": "epic dragon fantasy, massive detailed dragon, dramatic landscape, magical atmosphere, cinematic scale",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "dark-gothic",
    "name": "Dark Gothic",
    "category": "Fantasy",
    "desc": "Ornate gothic architecture with supernatural mood and deep shadow.",
    "tags": [
      "gothic",
      "dark",
      "ornate"
    ],
    "prompt": "dark gothic fantasy, ornate cathedral architecture, supernatural atmosphere, deep shadow, cold moonlight",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "magical-realism",
    "name": "Magical Realism",
    "category": "Fantasy",
    "desc": "Everyday realism gently blended with impossible magical details.",
    "tags": [
      "magic",
      "realism",
      "subtle"
    ],
    "prompt": "magical realism, believable everyday environment, subtle impossible magical detail, natural light, poetic atmosphere",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "dream-fantasy",
    "name": "Dream Fantasy",
    "category": "Fantasy",
    "desc": "Soft surreal landscapes with luminous color and dreamlike scale.",
    "tags": [
      "dream",
      "fantasy",
      "soft"
    ],
    "prompt": "dream fantasy, surreal luminous landscape, soft atmospheric color, floating impossible detail, dreamlike scale",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "cyberpunk",
    "name": "Cyberpunk",
    "category": "Sci Fi",
    "desc": "Neon future cities with rain, technology, and dense urban atmosphere.",
    "tags": [
      "sci fi",
      "cyberpunk",
      "neon"
    ],
    "prompt": "cyberpunk city, neon reflections, rain soaked surfaces, dense futuristic technology, cinematic night atmosphere",
    "best": [
      "FLUX",
      "SDXL",
      "WAN 2.2"
    ],
    "isNsfw": false
  },
  {
    "id": "retro-sci-fi",
    "name": "Retro Sci Fi",
    "category": "Sci Fi",
    "desc": "Analog future technology, practical sets, and vintage science fiction shapes.",
    "tags": [
      "sci fi",
      "retro",
      "vintage"
    ],
    "prompt": "retro science fiction, analog technology, practical set design, vintage futuristic shapes, period color palette",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "hard-sci-fi",
    "name": "Hard Sci Fi",
    "category": "Sci Fi",
    "desc": "Plausible future engineering with realistic spacecraft and industrial detail.",
    "tags": [
      "hard sci fi",
      "space",
      "realistic"
    ],
    "prompt": "hard science fiction, plausible future engineering, realistic spacecraft systems, industrial materials, physically grounded lighting",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "space-opera",
    "name": "Space Opera",
    "category": "Sci Fi",
    "desc": "Grand interstellar worlds, dramatic ships, and heroic cosmic scale.",
    "tags": [
      "space",
      "epic",
      "opera"
    ],
    "prompt": "space opera, grand interstellar setting, dramatic spacecraft, heroic cosmic scale, cinematic stellar lighting",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "solarpunk",
    "name": "Solarpunk",
    "category": "Sci Fi",
    "desc": "Optimistic green technology, bright architecture, and abundant nature.",
    "tags": [
      "solarpunk",
      "green",
      "future"
    ],
    "prompt": "solarpunk future, sustainable green technology, bright organic architecture, abundant plants, optimistic daylight",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "biopunk",
    "name": "Biopunk",
    "category": "Sci Fi",
    "desc": "Organic technology, laboratory atmosphere, and unsettling biological design.",
    "tags": [
      "biopunk",
      "organic",
      "future"
    ],
    "prompt": "biopunk science fiction, organic technology, advanced laboratory environment, biological structures, unsettling precision",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "dieselpunk",
    "name": "Dieselpunk",
    "category": "Sci Fi",
    "desc": "Industrial alternate history with heavy machinery and smoky atmosphere.",
    "tags": [
      "dieselpunk",
      "industrial",
      "retro"
    ],
    "prompt": "dieselpunk, heavy retro industrial machinery, alternate history design, smoke and steel, dramatic mechanical detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "atompunk",
    "name": "Atompunk",
    "category": "Sci Fi",
    "desc": "Atomic age future with 1950s optimism and streamlined machines.",
    "tags": [
      "atompunk",
      "atomic",
      "retro"
    ],
    "prompt": "atompunk future, 1950s atomic age design, streamlined machines, optimistic retro futurism, bright period colors",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "alien-world",
    "name": "Alien World",
    "category": "Sci Fi",
    "desc": "Unfamiliar ecosystems, strange geology, and otherworldly atmosphere.",
    "tags": [
      "alien",
      "planet",
      "world"
    ],
    "prompt": "alien world, unfamiliar ecosystem, strange geology, otherworldly sky, believable extraterrestrial environmental detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "spaceship-interior",
    "name": "Spaceship Interior",
    "category": "Sci Fi",
    "desc": "Detailed functional spacecraft interiors with cinematic practical lighting.",
    "tags": [
      "spaceship",
      "interior",
      "future"
    ],
    "prompt": "science fiction spacecraft interior, functional futuristic engineering, detailed panels, cinematic practical lighting, believable materials",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "horror",
    "name": "Horror",
    "category": "Horror",
    "desc": "Dark frightening atmosphere with ominous composition and tension.",
    "tags": [
      "horror",
      "dark",
      "creepy"
    ],
    "prompt": "cinematic horror, ominous atmosphere, unsettling composition, deep shadow, restrained frightening detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "gothic-horror",
    "name": "Gothic Horror",
    "category": "Horror",
    "desc": "Ancient gothic spaces with candlelight, decay, and supernatural dread.",
    "tags": [
      "gothic",
      "horror",
      "dark"
    ],
    "prompt": "gothic horror, ancient decaying architecture, candlelit shadows, supernatural dread, moody period atmosphere",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "cosmic-horror",
    "name": "Cosmic Horror",
    "category": "Horror",
    "desc": "Vast unknowable forces, impossible scale, and existential atmosphere.",
    "tags": [
      "cosmic",
      "horror",
      "surreal"
    ],
    "prompt": "cosmic horror, impossible ancient presence, vast unknowable scale, existential atmosphere, surreal darkness",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "psychological-horror",
    "name": "Psychological Horror",
    "category": "Horror",
    "desc": "Subtle unease, isolated framing, and disturbing everyday realism.",
    "tags": [
      "psychological",
      "uneasy",
      "realism"
    ],
    "prompt": "psychological horror, subtle visual unease, isolated composition, believable everyday setting, disturbing atmosphere",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "creature-horror",
    "name": "Creature Horror",
    "category": "Horror",
    "desc": "Detailed threatening creatures with cinematic darkness and tension.",
    "tags": [
      "creature",
      "monster",
      "horror"
    ],
    "prompt": "creature horror, detailed threatening creature, cinematic darkness, suspenseful reveal, realistic environment",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "haunted-house",
    "name": "Haunted House",
    "category": "Horror",
    "desc": "Old architecture, moonlit fog, and supernatural haunted atmosphere.",
    "tags": [
      "haunted",
      "house",
      "ghost"
    ],
    "prompt": "haunted house horror, old decaying architecture, moonlit fog, supernatural atmosphere, ominous windows and shadows",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "folk-horror",
    "name": "Folk Horror",
    "category": "Horror",
    "desc": "Rural traditions, isolated landscapes, and unsettling ritual atmosphere.",
    "tags": [
      "folk",
      "ritual",
      "rural"
    ],
    "prompt": "folk horror, isolated rural landscape, ancient ritual symbolism, natural muted color, quietly unsettling atmosphere",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "slasher-cinema",
    "name": "Slasher Cinema",
    "category": "Horror",
    "desc": "Tense night cinematography inspired by classic suspense horror films.",
    "tags": [
      "slasher",
      "cinema",
      "night"
    ],
    "prompt": "classic slasher cinema aesthetic, tense night lighting, suspenseful framing, practical film texture, ominous environment",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "analog-horror",
    "name": "Analog Horror",
    "category": "Horror",
    "desc": "Degraded videotape imagery with eerie broadcast artifacts and liminal mood.",
    "tags": [
      "analog",
      "vhs",
      "horror"
    ],
    "prompt": "analog horror, degraded VHS image, eerie broadcast artifacts, low fidelity video texture, liminal unsettling atmosphere",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "liminal-horror",
    "name": "Liminal Horror",
    "category": "Horror",
    "desc": "Empty familiar spaces with unnatural stillness and uncanny lighting.",
    "tags": [
      "liminal",
      "empty",
      "uncanny"
    ],
    "prompt": "liminal horror, empty familiar environment, unnatural stillness, fluorescent lighting, uncanny spatial atmosphere",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "polaroid",
    "name": "Polaroid",
    "category": "Vintage",
    "desc": "Instant film look with soft color fade and tactile photo texture.",
    "tags": [
      "vintage",
      "photo",
      "polaroid"
    ],
    "prompt": "Polaroid instant film, natural color fade, soft flash exposure, slight chemical color shift, tactile photo texture",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "1970s-photography",
    "name": "1970s Photography",
    "category": "Vintage",
    "desc": "Warm period film, authentic styling, and gentle grain.",
    "tags": [
      "1970s",
      "vintage",
      "film"
    ],
    "prompt": "authentic 1970s photography, warm film stock, period correct styling, gentle grain, vintage lens rendering",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "1980s-photography",
    "name": "1980s Photography",
    "category": "Vintage",
    "desc": "Flash photography, saturated consumer film, and unmistakable period color.",
    "tags": [
      "1980s",
      "retro",
      "film"
    ],
    "prompt": "authentic 1980s photography, direct flash, saturated consumer film color, period styling, natural film grain",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "1990s-photography",
    "name": "1990s Photography",
    "category": "Vintage",
    "desc": "Casual snapshot realism with compact camera flash and film color.",
    "tags": [
      "1990s",
      "snapshot",
      "film"
    ],
    "prompt": "1990s snapshot photography, compact camera flash, casual candid framing, period film color, authentic grain",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "black-and-white-film",
    "name": "Black and White Film",
    "category": "Vintage",
    "desc": "Classic monochrome film with rich tonal range and visible grain.",
    "tags": [
      "bw",
      "film",
      "classic"
    ],
    "prompt": "classic black and white film photography, rich tonal range, natural grain, silver gelatin character, timeless composition",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "35mm-film",
    "name": "35mm Film",
    "category": "Vintage",
    "desc": "Organic film grain, subtle halation, and natural photographic color.",
    "tags": [
      "35mm",
      "film",
      "photo"
    ],
    "prompt": "35mm film photography, organic grain, subtle highlight halation, natural color response, authentic lens character",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "kodachrome-look",
    "name": "Kodachrome Look",
    "category": "Vintage",
    "desc": "Rich archival slide film color with strong reds and deep contrast.",
    "tags": [
      "slide film",
      "color",
      "vintage"
    ],
    "prompt": "vintage slide film look, rich archival color, deep contrast, strong reds, fine film grain",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "victorian-photograph",
    "name": "Victorian Photograph",
    "category": "Vintage",
    "desc": "Formal antique portrait photography with period process texture.",
    "tags": [
      "victorian",
      "antique",
      "portrait"
    ],
    "prompt": "Victorian era photograph, formal period portrait, antique photographic process, subdued monochrome tones, authentic wardrobe",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "silent-film",
    "name": "Silent Film",
    "category": "Vintage",
    "desc": "Early cinema monochrome with theatrical lighting and aged film texture.",
    "tags": [
      "silent film",
      "cinema",
      "vintage"
    ],
    "prompt": "silent film aesthetic, early cinema monochrome, theatrical lighting, aged film texture, period framing",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "retro-travel-poster",
    "name": "Retro Travel Poster",
    "category": "Vintage",
    "desc": "Mid century travel advertising with simplified scenic illustration.",
    "tags": [
      "travel",
      "poster",
      "retro"
    ],
    "prompt": "retro travel poster, mid century graphic illustration, simplified scenic forms, limited print palette, vintage advertising composition",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "minimalist",
    "name": "Minimalist",
    "category": "Other",
    "desc": "Clean composition, strong negative space, and restrained detail.",
    "tags": [
      "minimal",
      "clean",
      "simple"
    ],
    "prompt": "minimalist visual style, strong negative space, restrained detail, clean geometry, focused composition",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "luxury-editorial",
    "name": "Luxury Editorial",
    "category": "Other",
    "desc": "Premium materials, sophisticated light, and elegant commercial polish.",
    "tags": [
      "luxury",
      "editorial",
      "premium"
    ],
    "prompt": "luxury editorial style, premium materials, sophisticated soft lighting, elegant composition, refined commercial polish",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "dreamy-soft-focus",
    "name": "Dreamy Soft Focus",
    "category": "Other",
    "desc": "Gentle glow, soft focus, pastel atmosphere, and romantic light.",
    "tags": [
      "dreamy",
      "soft",
      "glow"
    ],
    "prompt": "dreamy soft focus, gentle optical glow, pastel atmosphere, romantic diffused lighting, delicate detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "dark-moody",
    "name": "Dark Moody",
    "category": "Other",
    "desc": "Low key lighting, restrained color, and atmospheric shadow.",
    "tags": [
      "dark",
      "moody",
      "shadow"
    ],
    "prompt": "dark moody aesthetic, low key lighting, restrained color palette, atmospheric shadow, cinematic depth",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "bright-commercial",
    "name": "Bright Commercial",
    "category": "Other",
    "desc": "Clean high key imagery with polished color and advertising clarity.",
    "tags": [
      "bright",
      "commercial",
      "clean"
    ],
    "prompt": "bright commercial photography, high key lighting, clean polished color, crisp detail, advertising clarity",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "ethereal",
    "name": "Ethereal",
    "category": "Other",
    "desc": "Luminous haze, delicate light, and weightless dreamlike atmosphere.",
    "tags": [
      "ethereal",
      "light",
      "dream"
    ],
    "prompt": "ethereal aesthetic, luminous haze, delicate soft light, weightless atmosphere, subtle glowing detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "grunge",
    "name": "Grunge",
    "category": "Other",
    "desc": "Distressed texture, rough materials, and raw urban visual energy.",
    "tags": [
      "grunge",
      "rough",
      "texture"
    ],
    "prompt": "grunge aesthetic, distressed textures, rough materials, gritty urban detail, raw high contrast visual energy",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "neon-glow",
    "name": "Neon Glow",
    "category": "Other",
    "desc": "Dark backgrounds with vivid luminous edges and colorful light spill.",
    "tags": [
      "neon",
      "glow",
      "night"
    ],
    "prompt": "neon glow aesthetic, dark background, vivid luminous edges, colorful light spill, saturated futuristic lighting",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "monochrome",
    "name": "Monochrome",
    "category": "Other",
    "desc": "Single color family with strong shape, tone, and graphic cohesion.",
    "tags": [
      "mono",
      "graphic",
      "tone"
    ],
    "prompt": "monochrome visual style, single color family, strong tonal structure, clean graphic cohesion, controlled contrast",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "cinematic-desert",
    "name": "Cinematic Desert",
    "category": "Other",
    "desc": "Wide desert scale, purple dusk, dramatic sky, and polished atmosphere.",
    "tags": [
      "desert",
      "cinematic",
      "landscape"
    ],
    "prompt": "cinematic desert landscape, wide open scale, dramatic dusk sky, atmospheric mountains, polished film lighting",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": false
  },
  {
    "id": "boudoir-photography",
    "name": "Boudoir Photography",
    "category": "Adult 18+",
    "desc": "Tasteful intimate portrait photography with elegant posing and soft editorial lighting.",
    "tags": [
      "18+",
      "boudoir",
      "portrait"
    ],
    "prompt": "tasteful adult boudoir photography, elegant intimate portrait, flattering soft light, refined posing, premium editorial photography, sophisticated atmosphere",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "glamour",
    "name": "Glamour",
    "category": "Adult 18+",
    "desc": "Polished adult glamour portraiture with confident posing and premium studio lighting.",
    "tags": [
      "18+",
      "glamour",
      "editorial"
    ],
    "prompt": "adult glamour photography, confident elegant posing, polished studio lighting, premium editorial styling, refined skin detail, sophisticated composition",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "classic-pinup",
    "name": "Classic Pinup",
    "category": "Adult 18+",
    "desc": "Retro adult pinup styling with playful posing, vintage wardrobe, and period illustration influence.",
    "tags": [
      "18+",
      "pinup",
      "retro"
    ],
    "prompt": "classic adult pinup aesthetic, playful retro posing, vintage styling, polished mid century illustration influence, warm studio color, tasteful composition",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "sensual-portrait",
    "name": "Sensual Portrait",
    "category": "Adult 18+",
    "desc": "Mature portraiture focused on mood, expression, soft light, and elegant composition.",
    "tags": [
      "18+",
      "sensual",
      "portrait"
    ],
    "prompt": "mature sensual portrait, elegant composition, expressive pose, soft cinematic lighting, refined photographic detail, intimate sophisticated mood",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "artistic-nude",
    "name": "Artistic Nude",
    "category": "Adult 18+",
    "desc": "Fine art adult figure imagery emphasizing form, light, shadow, and composition.",
    "tags": [
      "18+",
      "fine art",
      "figure"
    ],
    "prompt": "adult artistic nude fine art, tasteful figure composition, sculptural light and shadow, elegant form study, museum quality photographic or painterly presentation",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "figure-study",
    "name": "Figure Study",
    "category": "Adult 18+",
    "desc": "Traditional adult figure study emphasizing anatomy, gesture, proportion, and studio lighting.",
    "tags": [
      "18+",
      "figure study",
      "art"
    ],
    "prompt": "adult fine art figure study, accurate anatomy and gesture, classical studio lighting, balanced composition, traditional life drawing sensibility, refined detail",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "mature-fantasy",
    "name": "Mature Fantasy",
    "category": "Adult 18+",
    "desc": "Adult fantasy styling with dramatic costumes, magical atmosphere, and sophisticated character design.",
    "tags": [
      "18+",
      "fantasy",
      "mature"
    ],
    "prompt": "mature adult fantasy aesthetic, sophisticated character design, dramatic fantasy wardrobe, magical atmosphere, cinematic lighting, richly detailed environment",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "mature-anime",
    "name": "Mature Anime",
    "category": "Adult 18+",
    "desc": "Adult oriented anime styling with polished illustration, mature characters, and cinematic presentation.",
    "tags": [
      "18+",
      "anime",
      "mature"
    ],
    "prompt": "mature adult anime illustration, clearly adult characters, polished line art, cinematic composition, refined shading, sophisticated visual styling",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "adult-cinematic",
    "name": "Adult Cinematic",
    "category": "Adult 18+",
    "desc": "Mature cinematic styling with intimate atmosphere, dramatic lighting, and polished film composition.",
    "tags": [
      "18+",
      "cinematic",
      "mature"
    ],
    "prompt": "mature adult cinematic aesthetic, intimate sophisticated atmosphere, dramatic motivated lighting, polished film composition, tasteful visual storytelling",
    "best": [
      "FLUX",
      "SDXL",
      "WAN 2.2"
    ],
    "isNsfw": true
  },
  {
    "id": "full-nude-photography",
    "name": "Full Nude Photography",
    "category": "Adult 18+",
    "desc": "Adult nude photography with full figure composition, natural anatomy, and polished studio lighting.",
    "tags": [
      "18+",
      "nude",
      "photography"
    ],
    "prompt": "clearly adult subject, full nude photography, full figure composition, natural anatomy, polished studio lighting, realistic skin detail, professional adult editorial photography",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "topless-glamour",
    "name": "Topless Glamour",
    "category": "Adult 18+",
    "desc": "Adult topless glamour portraiture with confident posing and premium editorial lighting.",
    "tags": [
      "18+",
      "topless",
      "glamour"
    ],
    "prompt": "clearly adult subject, topless glamour photography, confident elegant pose, premium editorial lighting, refined skin detail, polished adult magazine aesthetic",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "bottomless-glamour",
    "name": "Bottomless Glamour",
    "category": "Adult 18+",
    "desc": "Adult bottomless glamour imagery with sophisticated composition and cinematic lighting.",
    "tags": [
      "18+",
      "bottomless",
      "glamour"
    ],
    "prompt": "clearly adult subject, bottomless adult glamour photography, sophisticated composition, cinematic studio lighting, realistic skin detail, polished editorial presentation",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "nude-boudoir",
    "name": "Nude Boudoir",
    "category": "Adult 18+",
    "desc": "Intimate adult nude boudoir photography with soft light and elegant bedroom styling.",
    "tags": [
      "18+",
      "nude",
      "boudoir"
    ],
    "prompt": "clearly adult subject, nude boudoir photography, intimate bedroom setting, elegant posing, soft flattering light, realistic skin texture, premium adult editorial aesthetic",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "erotic-glamour",
    "name": "Erotic Glamour",
    "category": "Adult 18+",
    "desc": "Provocative adult glamour photography with bold posing and dramatic polished lighting.",
    "tags": [
      "18+",
      "erotic",
      "glamour"
    ],
    "prompt": "clearly adult subject, erotic glamour photography, provocative confident pose, dramatic polished lighting, premium adult magazine styling, highly detailed realistic photography",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "softcore-adult",
    "name": "Softcore Adult",
    "category": "Adult 18+",
    "desc": "Softcore adult magazine styling focused on nudity, sensual posing, and polished presentation.",
    "tags": [
      "18+",
      "softcore",
      "magazine"
    ],
    "prompt": "clearly adult subject, softcore adult magazine aesthetic, tasteful explicit nudity, sensual posing, polished studio photography, cinematic lighting, premium editorial finish",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "adult-magazine",
    "name": "Adult Magazine",
    "category": "Adult 18+",
    "desc": "Glossy adult magazine photography with bold studio presentation and high detail.",
    "tags": [
      "18+",
      "magazine",
      "editorial"
    ],
    "prompt": "clearly adult subject, glossy adult magazine photography, nude editorial presentation, bold studio composition, professional lighting, high detail skin and fabric texture, premium print aesthetic",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "1970s-adult-magazine",
    "name": "1970s Adult Magazine",
    "category": "Adult 18+",
    "desc": "Vintage 1970s adult magazine look with warm film color, soft focus, and period styling.",
    "tags": [
      "18+",
      "1970s",
      "vintage"
    ],
    "prompt": "clearly adult subject, 1970s adult magazine photography, nude vintage glamour, warm film color, subtle grain, soft focus lens character, authentic period interior and styling",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "1980s-adult-glamour",
    "name": "1980s Adult Glamour",
    "category": "Adult 18+",
    "desc": "1980s adult glamour with bold studio light, saturated color, and retro magazine styling.",
    "tags": [
      "18+",
      "1980s",
      "glamour"
    ],
    "prompt": "clearly adult subject, 1980s adult glamour photography, nude retro magazine styling, bold studio lighting, saturated color, soft diffusion, authentic period hair makeup and set design",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "nude-pinup",
    "name": "Nude Pinup",
    "category": "Adult 18+",
    "desc": "Adult nude pinup styling with playful retro posing and polished vintage presentation.",
    "tags": [
      "18+",
      "nude",
      "pinup"
    ],
    "prompt": "clearly adult subject, nude pinup aesthetic, playful retro pose, polished vintage studio presentation, warm period color, classic adult illustration and photography influence",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "nude-beach",
    "name": "Nude Beach",
    "category": "Adult 18+",
    "desc": "Adult nude beach photography with natural sunlight, coastal atmosphere, and realistic detail.",
    "tags": [
      "18+",
      "nude",
      "beach"
    ],
    "prompt": "clearly adult subject, nude beach photography, natural full body pose, warm coastal sunlight, realistic skin detail, ocean atmosphere, professional lifestyle photography",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "shower-nude",
    "name": "Shower Nude",
    "category": "Adult 18+",
    "desc": "Adult shower photography with wet skin, water detail, steam, and cinematic bathroom light.",
    "tags": [
      "18+",
      "nude",
      "shower"
    ],
    "prompt": "clearly adult subject, nude shower photography, wet skin and water droplets, subtle steam, cinematic bathroom lighting, realistic reflections, polished adult editorial composition",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "bedroom-nude",
    "name": "Bedroom Nude",
    "category": "Adult 18+",
    "desc": "Adult bedroom nude photography with natural posing and intimate cinematic light.",
    "tags": [
      "18+",
      "nude",
      "bedroom"
    ],
    "prompt": "clearly adult subject, bedroom nude photography, natural intimate pose, soft cinematic window light, realistic skin detail, elegant bedroom environment, polished adult editorial style",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "fine-art-nude-photo",
    "name": "Fine Art Nude Photo",
    "category": "Adult 18+",
    "desc": "Fine art adult nude photography emphasizing form, shadow, texture, and gallery composition.",
    "tags": [
      "18+",
      "fine art",
      "nude"
    ],
    "prompt": "clearly adult subject, fine art nude photography, sculptural full body form, dramatic light and shadow, refined texture, gallery quality composition, sophisticated photographic presentation",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "nude-couple-portrait",
    "name": "Nude Couple Portrait",
    "category": "Adult 18+",
    "desc": "Intimate adult couple nude portraiture with romantic posing and cinematic lighting.",
    "tags": [
      "18+",
      "couple",
      "nude"
    ],
    "prompt": "two clearly adult subjects, intimate nude couple portrait, romantic natural posing, cinematic soft lighting, realistic anatomy and skin detail, elegant adult editorial photography",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "mature-fantasy-nude",
    "name": "Mature Fantasy Nude",
    "category": "Adult 18+",
    "desc": "Adult fantasy nudity with magical environments, dramatic lighting, and detailed character design.",
    "tags": [
      "18+",
      "fantasy",
      "nude"
    ],
    "prompt": "clearly adult fantasy character, fantasy nude aesthetic, detailed anatomy, magical environment, dramatic cinematic lighting, ornate fantasy elements, polished mature illustration",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "mature-anime-nude",
    "name": "Mature Anime Nude",
    "category": "Adult 18+",
    "desc": "Adult anime nude illustration with clearly mature characters and polished cinematic rendering.",
    "tags": [
      "18+",
      "anime",
      "nude"
    ],
    "prompt": "clearly adult mature anime character, nude adult illustration, polished line art, refined anatomy, cinematic composition, sophisticated shading and lighting",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "retro-adult-photography",
    "name": "Retro Adult Photography",
    "category": "Adult 18+",
    "desc": "Retro adult nude photography with vintage film texture and authentic period studio styling.",
    "tags": [
      "18+",
      "retro",
      "nude"
    ],
    "prompt": "clearly adult subject, retro adult nude photography, vintage film grain, period studio lighting, authentic analog color, classic adult magazine composition",
    "best": [
      "FLUX",
      "SDXL"
    ],
    "isNsfw": true
  },
  {
    "id": "high-key-nude-studio",
    "name": "High Key Nude Studio",
    "category": "Adult 18+",
    "desc": "Bright adult nude studio photography with clean backgrounds and soft high key lighting.",
    "tags": [
      "18+",
      "studio",
      "nude"
    ],
    "prompt": "clearly adult subject, nude studio photography, bright high key lighting, clean seamless background, natural full body pose, refined realistic skin detail, professional editorial finish",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  },
  {
    "id": "low-key-nude-studio",
    "name": "Low Key Nude Studio",
    "category": "Adult 18+",
    "desc": "Moody adult nude studio photography with deep shadows and sculptural rim lighting.",
    "tags": [
      "18+",
      "studio",
      "low key"
    ],
    "prompt": "clearly adult subject, nude low key studio photography, deep controlled shadows, sculptural rim lighting, dramatic body contours, realistic skin detail, sophisticated adult fine art composition",
    "best": [
      "FLUX",
      "SDXL",
      "Z Image"
    ],
    "isNsfw": true
  }
];
