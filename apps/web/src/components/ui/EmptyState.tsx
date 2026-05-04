import Image from "next/image";

type Props = {
  message: string;
  submessage?: string;
};

export function EmptyState({ message, submessage }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex gap-4 mb-5 opacity-25">
        <Image src="/icono_espada_sf.png" alt="" width={36} height={36} className="object-contain" />
        <Image src="/icono_bastos_sf.png" alt="" width={36} height={36} className="object-contain" />
        <Image src="/icono_copas_sf.png" alt="" width={36} height={36} className="object-contain" />
        <Image src="/icono_oro_sf.png" alt="" width={36} height={36} className="object-contain" />
      </div>
      <p className="text-gray-500 font-medium text-sm">{message}</p>
      {submessage && <p className="text-gray-400 text-xs mt-1">{submessage}</p>}
    </div>
  );
}
