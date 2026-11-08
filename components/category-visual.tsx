"use client";
import Image from "next/image";
import {Smartphone,Tablet,Laptop,Watch,Headphones,Gamepad2,Cable,House,Camera,Package} from "lucide-react";
import {useInventory} from "./inventory";
const icons={phone:Smartphone,tablet:Tablet,laptop:Laptop,watch:Watch,audio:Headphones,gaming:Gamepad2,accessories:Cable,"home-appliances":House,other:Camera};
export function CategoryVisual({category}:{category:string}){const {products}=useInventory();const product=products.find(p=>p.category===category&&p.images?.length);const Icon=icons[category as keyof typeof icons]||Package;return product?<Image src={product.images![0].url} unoptimized alt="" width={320} height={220} className="categoryPhoto"/>:<div className={"categorySymbol category-"+category}><Icon aria-hidden/></div>}
