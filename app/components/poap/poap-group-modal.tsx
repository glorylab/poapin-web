import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/react";
import type { POAP } from "~/types/poap";
import PoapListItem from "~/components/poap/poap-list-item";
import { getMomentsCountOfDrop } from "~/utils/poap-utils";
import { cn } from "~/src/cn";

interface PoapGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  poaps: POAP[];
  dropsWithMoments: number[];
  title?: string;
}

export function PoapGroupModal({ 
  isOpen, 
  onClose, 
  poaps, 
  dropsWithMoments,
  title 
}: PoapGroupModalProps) {
  // Generate title from POAP date range if not provided
  const getDateRangeTitle = () => {
    if (title) return title;
    if (poaps.length === 0) return "POAPs";
    
    // Sort POAPs by date to get range
    const sortedPoaps = [...poaps].sort((a, b) => 
      new Date(a.event.start_date).getTime() - new Date(b.event.start_date).getTime()
    );
    
    const firstDate = new Date(sortedPoaps[0].event.start_date);
    const lastDate = new Date(sortedPoaps[sortedPoaps.length - 1].event.start_date);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    // If same date, show just one date (centered)
    if (firstDate.toDateString() === lastDate.toDateString()) {
      return formatDate(firstDate);
    }
    
    // Different dates, show range (centered)
    return `${formatDate(firstDate)} ~ ${formatDate(lastDate)}`;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="5xl"
      hideCloseButton
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[90vh] bg-background-800",
        body: "p-0",
        header: "border-b border-divider text-center"
      }}
    >
      <ModalContent className="bg-background-800">
        <ModalHeader className="flex flex-col gap-1 text-center">
          <h2 className="text-xl text-default-500/80 font-semibold text-center">{getDateRangeTitle()}</h2>
          <div className="mx-auto text-sm mt-2 text-default-500/50 bg-default-500/20 border border-default-500/30 text-center rounded-md px-2 py-1">
            {poaps.length} POAP{poaps.length !== 1 ? 's' : ''}
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="p-4">
            <section 
              aria-label="POAP Collection"
              className={cn(
                "grid gap-4 grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8"
              )}
            >
              {poaps.map((poap) => (
                <article 
                  key={poap.tokenId} 
                  aria-label={poap.event.name}
                  className="poap-item"
                >
                  <PoapListItem 
                    poap={poap} 
                    momentsCount={getMomentsCountOfDrop(poap, dropsWithMoments)} 
                  />
                </article>
              ))}
            </section>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
