"use client"

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

import { deleteWhistle } from "@/lib/actions/whistle.actions";

interface Props {
  whistleId: string;
  currentUserId: string;
  authorId: string;
  parentId: string | null;
  isComment?: boolean;
}

function deleteWhistle({
  whistleId,
  currentUserId,
  authorId,
  parentId,
  isComment,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  if (currentUserId !== authorId || pathname === "/") return null;

  return (
    <Image 
      src='assets/delete.svg'
      alt='delete'
      width={18}
      height={18}
      className='cursor-pointer object-contain'
      onClick={async () => {
        await deleteWhistle(JSON.parse(whistleId), pathname);
        if (!parentId || !isComment) {
          router.push("/");
        }
      }}
    />
  );
}

export default deleteWhistle;
