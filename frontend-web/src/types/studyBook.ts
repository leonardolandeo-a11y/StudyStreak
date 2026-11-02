export interface StudyBook {
    id:string;
    title:string;
    authors:string[];
    publishedDate:string | null;
    description:string | null;
    infoLink:string | null;
    thumbnailUrl:string | null;
    previewLink:string | null;
    publisher:string | null;
    pageCount:number | null;
    categories:string[];
}
