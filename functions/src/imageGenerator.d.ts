export interface TemplateData {
    themeColor: string;
    type: 'birthday' | 'anniversary' | 'baptism';
    name: string;
    message: string;
    churchName: string;
}
export declare function generateCelebrationImage(data: TemplateData): Promise<Buffer>;
//# sourceMappingURL=imageGenerator.d.ts.map