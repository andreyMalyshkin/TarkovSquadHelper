import axios from 'axios';

export interface Item {
    id: string;
    name: string;
    price: number;
}

export async function fetchData(): Promise<Item[]> {
    try {
        const response = await axios.post('https://api.tarkov.dev/graphql', {
            query: `
                {
                    items {
                        id
                        name
                        avg24hPrice
                        link
                    }
                }
            `
        }, {
            headers: { 'Content-Type': 'application/json' }
        });

        return response.data.data.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.avg24hPrice || 0,
            link: item.link,
        }));
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}
